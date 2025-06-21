package account

import (
	"context"
	"email-specter/config"
	"email-specter/database"
	"email-specter/model"
	"email-specter/util"
	"email-specter/web/middleware"
	"email-specter/web/shared"
	"errors"
	"fmt"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
	"log"
	"time"
)

func generateToken() (*string, error) {

	hash, err := util.GenerateRandomString(middleware.ExpectedLoginTokenLength / 2)

	if err != nil {
		return nil, fmt.Errorf("failed to generate random string: %w", err)
	}

	return &hash, nil

}

func storeToken(userId primitive.ObjectID, token string) {

	collection := database.MongoConn.Collection("login_tokens")

	_, err := collection.InsertOne(context.Background(), map[string]interface{}{
		"user_id":    userId,
		"token":      token,
		"created_at": time.Now(),
		"expires_at": time.Now().Add(config.SessionLength),
	})

	if err != nil {
		log.Printf("Error storing token for user %d: %v", userId, err)
	}

}

func generateLoginResponse(success bool, message string, token *string) map[string]interface{} {

	return map[string]interface{}{
		"success": success,
		"message": message,
		"data": map[string]*string{
			"token": token,
		},
	}

}

func authenticateUser(emailAddress string, password string) map[string]interface{} {

	var token *string

	const defaultErrorMessage = "The email address or password is incorrect."

	user, err := model.GetUserBy("email_address", emailAddress)

	if err != nil {
		return generateLoginResponse(false, defaultErrorMessage, token)
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))

	if err != nil {
		return generateLoginResponse(false, defaultErrorMessage, token)
	}

	token, err = generateToken()

	if err != nil {
		return generateLoginResponse(false, "There was an error generating your token, please try again.", token)
	}

	storeToken(user.Id, *token)

	return generateLoginResponse(true, "You have been successfully logged in.", token)

}

func validateRegistrationPayload(fullName string, emailAddress string, password string) error {

	if len(fullName) < 3 || len(fullName) > 100 {
		return util.NewValidationError("The full name must be between 3 and 100 characters.")
	}

	if len(emailAddress) < 3 || len(emailAddress) > 100 {
		return util.NewValidationError("The email address must be between 3 and 100 characters.")
	}

	if util.ValidateEmail(emailAddress) == false {
		return util.NewValidationError("The email address is not valid.")
	}

	if util.ValidatePassword(password) == false {
		return util.NewValidationError("The password must be between 8 and 100 characters.")
	}

	return nil

}

func doesEmailAddressExist(emailAddress string) bool {

	user, err := model.GetUserBy("email_address", emailAddress)

	if err != nil || user == nil {
		return false
	}

	return true

}

func createUserDocument(fullName string, emailAddress string, passwordHash string) error {

	collection := database.MongoConn.Collection("users")

	user := model.User{
		Id:           primitive.NewObjectID(),
		FullName:     fullName,
		EmailAddress: emailAddress,
		PasswordHash: passwordHash,
	}

	_, err := collection.InsertOne(context.Background(), user)

	if err != nil {
		return fmt.Errorf("failed to create user document: %w", err)
	}

	return nil

}

func hashPassword(password string) (*string, error) {

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)

	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	hashString := string(hash)

	return &hashString, nil

}

func isFirstUser() bool {

	collection := database.MongoConn.Collection("users")

	err := collection.FindOne(context.Background(), bson.M{}).Err()

	if errors.Is(err, mongo.ErrNoDocuments) {
		return true
	}

	return false

}

func createUser(fullName string, emailAddress string, password string) shared.ResponseMessage {

	if isFirstUser() == false {

		return shared.ResponseMessage{
			Success: false,
			Message: "It seems that the first user has already been created. If you are locked out, please ask an administrator to reset your account and/or hack the database to create a new user.",
		}

	} else if err := validateRegistrationPayload(fullName, emailAddress, password); err != nil {

		return shared.ResponseMessage{
			Success: false,
			Message: util.FormatError(err),
		}

	} else if doesEmailAddressExist(emailAddress) {

		return shared.ResponseMessage{
			Success: false,
			Message: "The email address is already in use.",
		}

	} else {

		passwordHash, err := hashPassword(password)

		if err != nil {

			return shared.ResponseMessage{
				Success: false,
				Message: "There was an error hashing your password, please try again.",
			}

		}

		err = createUserDocument(fullName, emailAddress, *passwordHash)

		if err != nil {

			return shared.ResponseMessage{
				Success: false,
				Message: fmt.Sprintf("There was an error creating your account, please try again. Error: %s", err.Error()),
			}

		}

		return shared.ResponseMessage{
			Success: true,
			Message: "You have been successfully registered. You can now log in.",
		}

	}

}

func logout(userId primitive.ObjectID, token string) {

	collection := database.MongoConn.Collection("login_tokens")

	_, err := collection.DeleteOne(context.Background(), bson.M{
		"user_id": userId,
		"token":   token,
	})

	if err != nil {
		log.Printf("Error deleting token for user %d: %v", userId, err)
	}

}
