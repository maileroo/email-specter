package database

import (
	"context"
	"email-specter/config"
	"fmt"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var MongoConn *mongo.Database

func getMongoConnection() *mongo.Database {

	mongoOptions := options.Client().ApplyURI(config.MongoConnStr)

	client, err := mongo.Connect(context.Background(), mongoOptions)

	if err != nil {
		panic(err)
	}

	if err := client.Ping(context.Background(), nil); err != nil {
		panic(fmt.Sprintf("Failed to ping MongoDB: %v", err))
	}

	return client.Database(config.MongoDb)

}
