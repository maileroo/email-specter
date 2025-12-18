package webhook

import (
	"email-specter/model"
	"errors"
	"log"

	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func updateMessageStatus(webhookData model.WebhookEvent, message *model.Message, event model.Event, status string, currentTime time.Time) bool {

	// Prepend Reception events to ensure they're always first
	if event.Type == "Reception" {
		message.Events = append([]model.Event{event}, message.Events...)
	} else {
		message.Events = append(message.Events, event)
	}

	isFinalStatus := message.LastStatus == "Delivery" || message.LastStatus == "Bounce" || message.LastStatus == "TransientFailure"

	if !(status == "Reception" && isFinalStatus) {
		message.LastStatus = status
	}

	message.UpdatedAt = currentTime

	if status == "Bounce" || status == "TransientFailure" {

		message.KumoMtaBounceClassification = webhookData.BounceClassification
		message.EmailSpecterBounceClassification = categorizeBounce(webhookData)

	} else {

		message.KumoMtaBounceClassification = ""
		message.EmailSpecterBounceClassification = ""

	}

	// Only overwrite if new value is not empty (Reception events don't have these)
	newDestService := getServiceName(webhookData.PeerAddress.Name, message.DestinationDomain)
	newSourceIP := getIPAddress(webhookData.SourceAddress.Address)

	if newDestService != "Unknown" || message.DestinationService == "" {
		message.DestinationService = newDestService
	}
	if newSourceIP != "" {
		message.SourceIP = newSourceIP
	}

	err := message.Save()

	if err != nil {
		log.Printf("[Message] FAILED to save: KumoID=%s, Error=%v", message.KumoMtaID, err)
		return false
	}

	go upsertAggregatedEvent(message.MtaId, message, currentTime)
	return true

}

func getOrCreateMessage(mtaId primitive.ObjectID, webhookData model.WebhookEvent, currentTime time.Time) (*model.Message, error) {

	message, err := model.GetMessageByKumoMtaID(webhookData.ID)

	if err != nil {

		if errors.Is(err, mongo.ErrNoDocuments) {

			message = createMessageObject(mtaId, currentTime, webhookData)

			if err := message.Insert(); err != nil {
				// Race condition: another goroutine inserted it first
				// Retry the lookup
				if mongo.IsDuplicateKeyError(err) {
					log.Printf("[Message] Duplicate key (race condition), retrying lookup: KumoID=%s", webhookData.ID)
					message, err = model.GetMessageByKumoMtaID(webhookData.ID)
					if err != nil {
						log.Printf("[Message] FAILED retry lookup: KumoID=%s, Error=%v", webhookData.ID, err)
						return nil, err
					}
					return message, nil
				}
				log.Printf("[Message] FAILED to insert new: KumoID=%s, Error=%v", webhookData.ID, err)
				return nil, err
			}

			return message, nil

		}

		log.Printf("[Message] DB error looking up: KumoID=%s, Error=%v", webhookData.ID, err)
		return nil, err

	}

	return message, nil

}

func createMessageObject(mtaId primitive.ObjectID, currentTime time.Time, webhookData model.WebhookEvent) *model.Message {

	sourceIpAddress := getIPAddress(webhookData.SourceAddress.Address)
	sourceDomain := getDomain(webhookData.Sender)
	receiverDomain := getDomain(webhookData.Recipient)

	message := model.Message{
		ID:                               primitive.NewObjectID(),
		MtaId:                            mtaId,
		KumoMtaID:                        webhookData.ID,
		SourceIP:                         sourceIpAddress,
		SourceDomain:                     sourceDomain,
		DestinationService:               getServiceName(webhookData.PeerAddress.Name, sourceDomain),
		DestinationDomain:                receiverDomain,
		Sender:                           webhookData.Sender,
		Recipient:                        webhookData.Recipient,
		Events:                           []model.Event{},
		KumoMtaBounceClassification:      webhookData.BounceClassification,
		EmailSpecterBounceClassification: categorizeBounce(webhookData),
		LastStatus:                       webhookData.Type,
		CreatedAt:                        currentTime,
		UpdatedAt:                        currentTime,
	}

	return &message

}
