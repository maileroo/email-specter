package webhook

import (
	"crypto/subtle"
	"email-specter/model"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func isAuthenticated(id string, token string) bool {

	objectId, err := primitive.ObjectIDFromHex(id)

	if err != nil {
		return false
	}

	mta, err := model.GetMTAByID(objectId)

	if err != nil {
		return false
	}

	if subtle.ConstantTimeCompare([]byte(mta.SecretToken), []byte(token)) == 0 {
		return false
	}

	return true

}

func processWebhook(mtaId string, webhookData model.WebhookEvent) bool {

	mtaIdObject, err := primitive.ObjectIDFromHex(mtaId)

	if err != nil {
		return false
	}

	switch webhookData.Type {

	case "Reception":
		return handleReceptionEvent(mtaIdObject, webhookData)

	case "Delivery":
		return handleDeliveryEvent(mtaIdObject, webhookData)

	case "TransientFailure":
		return handleTransientFailureEvent(mtaIdObject, webhookData)

	case "Bounce":
		return handleBounceEvent(mtaIdObject, webhookData)

	}

	return false

}
