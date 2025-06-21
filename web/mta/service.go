package mta

import (
	"context"
	"email-specter/config"
	"email-specter/database"
	"email-specter/model"
	"email-specter/util"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

const secretTokenLength = 64

var collection = database.MongoConn.Collection("mtas")

func getAllMTAs() map[string]interface{} {

	cursor, err := collection.Find(context.Background(), primitive.M{})

	if err != nil {

		return map[string]interface{}{
			"success": false,
			"message": "Failed to retrieve MTAs: " + err.Error(),
		}

	}

	var mtas []model.MTA

	if err = cursor.All(context.Background(), &mtas); err != nil {

		return map[string]interface{}{
			"success": false,
			"message": "Failed to decode MTAs: " + err.Error(),
		}

	}

	for i, mta := range mtas {

		mtas[i] = model.MTA{
			ID:            mta.ID,
			Name:          mta.Name,
			SecretToken:   mta.SecretToken,
			CollectionUrl: config.BackendUrl + "collect/" + mta.ID + "/" + mta.SecretToken,
		}

	}

	return map[string]interface{}{
		"success": true,
		"mtas":    mtas,
	}

}

func addMTA(name string) map[string]interface{} {

	secretToken, err := util.GenerateRandomString(secretTokenLength / 2)

	if err != nil {

		return map[string]interface{}{
			"success": false,
			"message": "Failed to generate secret token: " + err.Error(),
		}
	}

	mta := model.MTA{
		ID:          primitive.NewObjectID().Hex(),
		Name:        name,
		SecretToken: secretToken,
	}

	_, err = collection.InsertOne(context.Background(), mta)

	if err != nil {

		return map[string]interface{}{
			"success": false,
			"message": "Failed to add MTA: " + err.Error(),
		}

	}

	return map[string]interface{}{
		"success": true,
		"message": "The MTA has been added successfully",
		"mta":     mta,
	}

}

func editMTA(mtaID string, name string) map[string]interface{} {

	objectID, err := primitive.ObjectIDFromHex(mtaID)

	if err != nil {

		return map[string]interface{}{
			"success": false,
			"message": "Invalid MTA ID: " + err.Error(),
		}

	}

	update := primitive.M{
		"$set": primitive.M{
			"name": name,
		},
	}

	result, err := collection.UpdateOne(context.Background(), primitive.M{"_id": objectID}, update)

	if err != nil || result.ModifiedCount == 0 {

		return map[string]interface{}{
			"success": false,
			"message": "Failed to update MTA!",
		}

	}

	return map[string]interface{}{
		"success": true,
		"message": "The MTA has been updated successfully",
	}

}

func deleteMTA(mtaID string) map[string]interface{} {

	objectID, err := primitive.ObjectIDFromHex(mtaID)

	if err != nil {

		return map[string]interface{}{
			"success": false,
			"message": "Invalid MTA ID: " + err.Error(),
		}

	}

	result, err := collection.DeleteOne(context.Background(), primitive.M{"_id": objectID})

	if err != nil || result.DeletedCount == 0 {

		return map[string]interface{}{
			"success": false,
			"message": "Failed to delete MTA!",
		}

	}

	return map[string]interface{}{
		"success": true,
		"message": "The MTA has been deleted successfully",
	}

}

func rotateSecretToken(mtaID string) map[string]interface{} {

	objectID, err := primitive.ObjectIDFromHex(mtaID)

	if err != nil {

		return map[string]interface{}{
			"success": false,
			"message": "Invalid MTA ID: " + err.Error(),
		}

	}

	update := primitive.M{
		"$set": primitive.M{
			"secret_token": util.GenerateRandomString(secretTokenLength / 2),
		},
	}

	result, err := collection.UpdateOne(context.Background(), primitive.M{"_id": objectID}, update)

	if err != nil || result.ModifiedCount == 0 {

		return map[string]interface{}{
			"success": false,
			"message": "Failed to rotate secret token.",
		}

	}

	return map[string]interface{}{
		"success": true,
		"message": "The secret token has been rotated successfully",
	}

}
