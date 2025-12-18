package config

import (
	"email-specter/util"
	"os"
	"time"

	"github.com/joho/godotenv"
)

var MongoConnStr string
var MongoDb string

var SessionLength time.Duration

var HttpPort string
var ListenAddress string

var LogRetentionPeriod time.Duration
var DataRetentionPeriod time.Duration

var TopEntitiesCacheDuration time.Duration

func loadConfig() {

	_ = godotenv.Load(".env")

	MongoConnStr = os.Getenv("MONGO_CONN_STR")
	MongoDb = os.Getenv("MONGO_DB")

	SessionLength, _ = util.ParseDuration(os.Getenv("SESSION_LENGTH"))

	HttpPort = os.Getenv("HTTP_PORT")
	ListenAddress = os.Getenv("LISTEN_ADDRESS")

	LogRetentionPeriod, _ = util.ParseDuration(os.Getenv("LOG_RETENTION_PERIOD"))
	DataRetentionPeriod, _ = util.ParseDuration(os.Getenv("DATA_RETENTION_PERIOD"))

	TopEntitiesCacheDuration, _ = util.ParseDuration(os.Getenv("TOP_ENTITIES_CACHE_DURATION"))

}

func init() {
	loadConfig()
}
