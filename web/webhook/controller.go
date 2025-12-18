package webhook

import (
	"email-specter/model"
	"email-specter/util"

	"github.com/gofiber/fiber/v2"
)

func ProcessWebhook(c *fiber.Ctx) error {

	var body model.WebhookEvent

	id := c.Params("id")
	token := c.Params("token")

	if !isAuthenticated(id, token) {

		return c.JSON(map[string]interface{}{
			"success": false,
			"message": "You are not authorized to access this resource.",
		})

	}

	if err := util.ParseBodyRequest(c, &body); err != nil {

		return c.JSON(map[string]interface{}{
			"success": false,
			"message": util.FormatError(err),
		})

	}

	response := processWebhook(id, body)

	if response {

		return c.JSON(map[string]interface{}{
			"success": true,
			"message": "Webhook processed successfully.",
		})

	} else {

		return c.JSON(map[string]interface{}{
			"success": false,
			"message": "There was an error processing the webhook.",
		})

	}

}

func ProcessBatchWebhook(c *fiber.Ctx) error {

	var body []model.WebhookEvent

	id := c.Params("id")
	token := c.Params("token")

	if !isAuthenticated(id, token) {

		return c.JSON(map[string]interface{}{
			"success": false,
			"message": "You are not authorized to access this resource.",
		})

	}

	if err := util.ParseBodyRequest(c, &body); err != nil {

		return c.JSON(map[string]interface{}{
			"success": false,
			"message": util.FormatError(err),
		})

	}

	successCount := 0
	failCount := 0

	for _, event := range body {

		if processWebhook(id, event) {
			successCount++
		} else {
			failCount++
		}

	}

	return c.JSON(map[string]interface{}{
		"success":       failCount == 0,
		"message":       "Batch webhook processed.",
		"total":         len(body),
		"success_count": successCount,
		"fail_count":    failCount,
	})

}
