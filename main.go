package main

import (
	"context"
	"email-specter/config"
	"email-specter/database"
	"email-specter/task"
	"email-specter/web/account"
	"email-specter/web/data"
	"email-specter/web/middleware"
	"email-specter/web/mta"
	"email-specter/web/webhook"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-co-op/gocron/v2"
	"github.com/gofiber/fiber/v2"
)

const maxBodySize = 5 * 1024 * 1024 * 1024

func runWebserver(shutdownCtx context.Context) {

	app := fiber.New(fiber.Config{
		Prefork:   false,
		BodyLimit: maxBodySize,
	})

	// CORS Middleware

	app.Use(func(c *fiber.Ctx) error {

		c.Set("Access-Control-Allow-Origin", "*")
		c.Set("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS")
		c.Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Method() == fiber.MethodOptions {
			return c.SendStatus(fiber.StatusNoContent)
		}

		return c.Next()

	})

	api := app.Group("/api")

	api.Get("/", func(c *fiber.Ctx) error {

		return c.JSON(fiber.Map{
			"success": true,
			"message": "Welcome to the Email Specter API!",
		})

	})

	api.Get("/can-register", account.CanRegister)
	api.Post("/register", account.Register)
	api.Post("/login", account.Login)
	api.Get("/account", middleware.OnlyAuthenticatedUsers, account.GetAccount)
	api.Patch("/account/change-full-name", middleware.OnlyAuthenticatedUsers, account.ChangeFullName)
	api.Patch("/account/change-password", middleware.OnlyAuthenticatedUsers, account.ChangePassword)
	api.Patch("/account/change-email", middleware.OnlyAuthenticatedUsers, account.ChangeEmail)
	api.Post("/logout", middleware.OnlyAuthenticatedUsers, account.Logout)

	api.Get("/mta", middleware.OnlyAuthenticatedUsers, mta.GetAllMTAs)
	api.Post("/mta", middleware.OnlyAuthenticatedUsers, mta.AddMTA)
	api.Patch("/mta/:id", middleware.OnlyAuthenticatedUsers, mta.EditMTA)
	api.Delete("/mta/:id", middleware.OnlyAuthenticatedUsers, mta.DeleteMTA)
	api.Post("/mta/:id/rotate-secret-token", middleware.OnlyAuthenticatedUsers, mta.RotateSecretToken)

	api.Post("/webhook/:id/:token", webhook.ProcessWebhook)
	api.Post("/batch-webhook/:id/:token", webhook.ProcessBatchWebhook)

	api.Get("/reports/aggregated-data", middleware.OnlyAuthenticatedUsers, data.GetAggregatedData)
	api.Post("/reports/generate", middleware.OnlyAuthenticatedUsers, data.GenerateReport)
	api.Post("/reports/provider-event-data", middleware.OnlyAuthenticatedUsers, data.GetProviderData)
	api.Post("/reports/provider-classification-data", middleware.OnlyAuthenticatedUsers, data.GetProviderClassificationData)
	api.Get("/reports/top-entities", middleware.OnlyAuthenticatedUsers, data.GetTopEntities)
	api.Post("/messages", middleware.OnlyAuthenticatedUsers, data.GetMessages)

	app.All("/api/*", func(c *fiber.Ctx) error {

		return c.JSON(fiber.Map{
			"success": false,
			"message": "Quo vadis, amicus?",
		})

	})

	go func() {

		if err := app.Listen(config.ListenAddress + ":" + config.HttpPort); err != nil {
			log.Fatalf("Error starting HTTP server: %v", err)
		}

	}()

	<-shutdownCtx.Done()
	_ = app.Shutdown()
	log.Println("Webserver shutting down...")

}

func handleScheduleError(_ gocron.Job, err error) {

	if err != nil {
		panic(err)
	}

}

func runScheduler(shutdownCtx context.Context) {

	s, err := gocron.NewScheduler()

	if err != nil {
		log.Fatalf("Error starting scheduler: %v", err)
	}

	handleScheduleError(s.NewJob(gocron.DurationJob(1*time.Hour), gocron.NewTask(task.CleanLoginTokens)))
	handleScheduleError(s.NewJob(gocron.DurationJob(1*time.Hour), gocron.NewTask(task.CleanMessages)))
	handleScheduleError(s.NewJob(gocron.DurationJob(24*time.Hour), gocron.NewTask(task.CleanAggregatedData)))

	s.Start()
	<-shutdownCtx.Done()
	s.Shutdown()

	log.Println("Scheduler shutting down...")

}

func boot() {
	database.CreateDatabaseConnections()
	task.CreateIndexes()
}

func main() {

	shutdownCtx, shutdownCancel := context.WithCancel(context.Background())
	defer shutdownCancel()

	signalChan := make(chan os.Signal, 1)
	signal.Notify(signalChan, os.Interrupt, syscall.SIGTERM)

	defer signal.Stop(signalChan)

	boot()

	go runScheduler(shutdownCtx)
	go runWebserver(shutdownCtx)

	<-signalChan

	shutdownCancel()

	log.Println("Received shutdown signal, shutting down...")

}
