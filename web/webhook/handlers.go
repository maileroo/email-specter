package webhook

import (
	"email-specter/model"
	"log"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"time"
)

// handleReceptionEvent is triggered when a message is received by the MTA.
// This is the first event that occurs when a message is received either by SMTP or API.
// A message can only have one reception event.
// A message with multiple recipients will generate multiple reception events, one for each recipient with a unique Kumo Message ID.
func handleReceptionEvent(mtaId primitive.ObjectID, webhookData model.WebhookEvent) bool {

	eventTime := time.Unix(webhookData.Timestamp, 0)
	currentTime := time.Now()

	event := model.Event{
		Type:     webhookData.Type,
		Content:  "",
		Datetime: eventTime,
	}

	message, err := getOrCreateMessage(mtaId, webhookData, currentTime)

	if err != nil {
		log.Printf("[Reception] FAILED getOrCreateMessage: ID=%s, Error=%v", webhookData.ID, err)
		return false
	}

	result := updateMessageStatus(webhookData, message, event, webhookData.Type, currentTime)

	if !result {
		log.Printf("[Reception] FAILED updateMessageStatus: ID=%s", webhookData.ID)
	}

	return result

}

// handleBounceEvent is triggered when a hard bounce event occurs.
// Or if the message runs out of retries and is considered a hard bounce.
// A message can only have one hard bounce event.
func handleBounceEvent(mtaId primitive.ObjectID, webhookData model.WebhookEvent) bool {

	eventTime := time.Unix(webhookData.Timestamp, 0)
	currentTime := time.Now()

	event := model.Event{
		Type:     webhookData.Type,
		Content:  webhookData.Response.Content,
		Datetime: eventTime,
	}

	message, err := getOrCreateMessage(mtaId, webhookData, currentTime)

	if err != nil {
		log.Printf("[Bounce] FAILED getOrCreateMessage: ID=%s, Error=%v", webhookData.ID, err)
		return false
	}

	result := updateMessageStatus(webhookData, message, event, webhookData.Type, currentTime)

	if !result {
		log.Printf("[Bounce] FAILED updateMessageStatus: ID=%s", webhookData.ID)
	}

	return result

}

// handleTransientFailureEvent handles transient failures such as temporary delivery issues.
// But it can generate multiple times for the same message based on the retry and max_age settings.
// If KumoMTA's classifier is not setup, then it will pretty much trigger for every failed delivery attempt regardless of soft or hard bounces.
// A message can have *many* transient failure events.
func handleTransientFailureEvent(mtaId primitive.ObjectID, webhookData model.WebhookEvent) bool {

	eventTime := time.Unix(webhookData.Timestamp, 0)
	currentTime := time.Now()

	event := model.Event{
		Type:     webhookData.Type,
		Content:  webhookData.Response.Content,
		Datetime: eventTime,
	}

	message, err := getOrCreateMessage(mtaId, webhookData, currentTime)

	if err != nil {
		log.Printf("[TransientFailure] FAILED getOrCreateMessage: ID=%s, Error=%v", webhookData.ID, err)
		return false
	}

	result := updateMessageStatus(webhookData, message, event, webhookData.Type, currentTime)

	if !result {
		log.Printf("[TransientFailure] FAILED updateMessageStatus: ID=%s", webhookData.ID)
	}

	return result

}

// handleDeliveryEvent is triggered when a message is successfully delivered.
// A message will always have one delivery event.
func handleDeliveryEvent(mtaId primitive.ObjectID, webhookData model.WebhookEvent) bool {

	eventTime := time.Unix(webhookData.Timestamp, 0)
	currentTime := time.Now()

	event := model.Event{
		Type:     webhookData.Type,
		Content:  webhookData.Response.Content,
		Datetime: eventTime,
	}

	message, err := getOrCreateMessage(mtaId, webhookData, currentTime)

	if err != nil {
		log.Printf("[Delivery] FAILED getOrCreateMessage: ID=%s, Error=%v", webhookData.ID, err)
		return false
	}

	result := updateMessageStatus(webhookData, message, event, webhookData.Type, currentTime)

	if !result {
		log.Printf("[Delivery] FAILED updateMessageStatus: ID=%s", webhookData.ID)
	}

	return result

}
