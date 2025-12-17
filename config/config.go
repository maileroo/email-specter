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

var BackendUrl string
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

	BackendUrl = getCorrectedBackendUrl(os.Getenv("BACKEND_URL"))
	HttpPort = os.Getenv("HTTP_PORT")
	ListenAddress = os.Getenv("LISTEN_ADDRESS")

	LogRetentionPeriod, _ = util.ParseDuration(os.Getenv("LOG_RETENTION_PERIOD"))
	DataRetentionPeriod, _ = util.ParseDuration(os.Getenv("DATA_RETENTION_PERIOD"))

	TopEntitiesCacheDuration, _ = util.ParseDuration(os.Getenv("TOP_ENTITIES_CACHE_DURATION"))

}

func getCorrectedBackendUrl(url string) string {

	if url == "" {
		return findBackendUrl()
	}

	return addSlashIfNeeded(url)

}

func addSlashIfNeeded(url string) string {

	if len(url) > 0 && url[len(url)-1] != '/' {
		return url + "/"
	}

	return url

}

func findBackendUrl() string {

	ipAddress, err := util.SendGetRequest("https://ifconfig.me/ip")

	if err != nil {
		panic("Failed to get public IP address: " + err.Error())
	}

	if ipAddress == "" {
		panic("Public IP address is empty. Please check your network connection.")
	}

	return "http://" + ipAddress + "/"

}

func init() {
	loadConfig()
}
