package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
    "go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID       primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Name     string             `json:"name" bson:"name"`
	Email    string             `json:"email" bson:"email"`
	Password string             `json:"password" bson:"password"`
}

type Task struct {
	ID        primitive.ObjectID `json:"id,omitempty" bson:"_id,omitempty"`
	UserID    string             `json:"userId" bson:"userId"`
	Title     string             `json:"title" bson:"title"`
	Category  string             `json:"category" bson:"category"`
	Completed bool               `json:"completed" bson:"completed"`
	Time      string             `json:"time" bson:"time"`
}

type ChatMessage struct {
	UserID  string `json:"userId" bson:"userId"`
	Role    string `json:"role" bson:"role"`
	Content string `json:"content" bson:"content"`
}

var userCollection *mongo.Collection
var taskCollection *mongo.Collection
var chatCollection *mongo.Collection

func main() {
	godotenv.Load()

	MONGO_URI := os.Getenv("MONGODB_URI")

	clientOptions := options.Client().ApplyURI(MONGO_URI)

	client, err := mongo.Connect(context.TODO(), clientOptions)

	if err != nil {
		log.Fatal(err)
	}

	db := client.Database("aura")

	userCollection = db.Collection("users")
	taskCollection = db.Collection("tasks")
	chatCollection = db.Collection("chat")

	r := gin.Default()

	// -------- SIGNUP --------
r.POST("/api/auth/signup", func(c *gin.Context) {

	var u User

	if err := c.ShouldBindJSON(&u); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := userCollection.InsertOne(context.TODO(), u)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User already exists"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"user": gin.H{
			"id":    result.InsertedID,
			"name":  u.Name,
			"email": u.Email,
		},
	})
})
	// -------- LOGIN --------

	r.POST("/api/auth/login", func(c *gin.Context) {

		var login User
		c.ShouldBindJSON(&login)

		var user User

		err := userCollection.FindOne(
			context.TODO(),
			bson.M{"email": login.Email, "password": login.Password},
		).Decode(&user)

		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
	"success": true,
	"user": gin.H{
		"id":    user.ID.Hex(),
		"name":  user.Name,
		"email": user.Email,
	},
})
	})

	// -------- GET TASKS --------

	r.GET("/api/tasks", func(c *gin.Context) {

		userId := c.Query("userId")

		cursor, _ := taskCollection.Find(
			context.TODO(),
			bson.M{"userId": userId},
		)

var tasks []Task
err := cursor.All(context.TODO(), &tasks)
if err != nil {
	c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	return
}
var result []gin.H

for _, t := range tasks {
	result = append(result, gin.H{
		"id":        t.ID.Hex(),
		"userId":    t.UserID,
		"title":     t.Title,
		"category":  t.Category,
		"completed": t.Completed,
		"time":      t.Time,
	})
}

c.JSON(http.StatusOK, result)
	})

	// -------- ADD TASK --------

	r.POST("/api/tasks", func(c *gin.Context) {

		var task Task

		c.ShouldBindJSON(&task)


		task.ID = primitive.NewObjectID()
		
		task.Completed = false

taskCollection.InsertOne(context.TODO(), task)

		c.JSON(http.StatusOK, task)
	})

	// -------- UPDATE TASK --------

r.PATCH("/api/tasks/:id", func(c *gin.Context) {

	id := c.Param("id")

	var body map[string]interface{}
	c.ShouldBindJSON(&body)

	objId, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	taskCollection.UpdateOne(
		context.TODO(),
		bson.M{"_id": objId},
		bson.M{"$set": body},
	)

	c.JSON(http.StatusOK, gin.H{"success": true})
})

	// -------- DELETE TASK --------
r.DELETE("/api/tasks/:id", func(c *gin.Context) {

	id := c.Param("id")

	objId, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	taskCollection.DeleteOne(
		context.TODO(),
		bson.M{"_id": objId},
	)

	c.JSON(http.StatusOK, gin.H{"success": true})
})
	// -------- GET CHAT --------

	r.GET("/api/chat", func(c *gin.Context) {

		userId := c.Query("userId")

		cursor, _ := chatCollection.Find(
			context.TODO(),
			bson.M{"userId": userId},
		)

		var chat []ChatMessage

		cursor.All(context.TODO(), &chat)

		c.JSON(http.StatusOK, chat)
	})

	// -------- ADD CHAT --------

	r.POST("/api/chat", func(c *gin.Context) {

		var msg ChatMessage

		c.ShouldBindJSON(&msg)

		chatCollection.InsertOne(context.TODO(), msg)

		c.JSON(http.StatusOK, gin.H{"success": true})
	})

	port := os.Getenv("PORT")

	if port == "" {
		port = "3000"
	}

	log.Println("🚀 Server running on http://localhost:" + port)

	r.Run(":" + port)
}