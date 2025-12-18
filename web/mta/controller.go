package mta

import (
	"email-specter/util"
	"github.com/gofiber/fiber/v2"
)

func GetAllMTAs(c *fiber.Ctx) error {

	baseUrl := getBaseUrl(c)
	response := getAllMTAs(baseUrl)

	return c.JSON(response)

}

func AddMTA(c *fiber.Ctx) error {

	var request struct {
		Name string `json:"name"`
	}

	if err := util.ParseBodyRequest(c, &request); err != nil {

		return c.JSON(map[string]interface{}{
			"success": false,
			"message": util.FormatError(err),
		})

	}

	baseUrl := getBaseUrl(c)
	response := addMTA(request.Name, baseUrl)

	return c.JSON(response)

}

func EditMTA(c *fiber.Ctx) error {

	var request struct {
		Name string `json:"name"`
	}

	if err := util.ParseBodyRequest(c, &request); err != nil {

		return c.JSON(map[string]interface{}{
			"success": false,
			"message": util.FormatError(err),
		})

	}

	mtaID := c.Params("id")
	response := editMTA(mtaID, request.Name)

	return c.JSON(response)

}

func DeleteMTA(c *fiber.Ctx) error {

	mtaID := c.Params("id")

	response := deleteMTA(mtaID)

	return c.JSON(response)

}

func RotateSecretToken(c *fiber.Ctx) error {

	mtaID := c.Params("id")

	response := rotateSecretToken(mtaID)

	return c.JSON(response)

}

func getBaseUrl(c *fiber.Ctx) string {

	protocol := c.Protocol()
	host := c.Hostname()

	return protocol + "://" + host + "/"

}
