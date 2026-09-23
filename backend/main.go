package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	validation "github.com/pocketbase/ozzo-validation/v4"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"

	_ "alke/backend/migrations"
)

// The range a date of birth has to put an account in, in whole years.
const (
	minAge = 15
	maxAge = 100
)

func main() {
	app := pocketbase.New()

	bindPrograms(app)

	// The collection's own `min`/`max` are absolute dates, and "fifteen years
	// old today" is not an absolute date — it moves every midnight. So the
	// range is checked here, against the clock, on every write.
	app.OnRecordValidate("users").BindFunc(func(e *core.RecordEvent) error {
		born := e.Record.GetDateTime("date_of_birth")
		if born.IsZero() {
			// Emptiness is the field's own business; `required` reports it.
			return e.Next()
		}

		age := yearsBetween(born.Time(), time.Now())
		if age < minAge || age > maxAge {
			return validation.Errors{
				"date_of_birth": validation.NewError(
					"validation_date_of_birth_out_of_range",
					fmt.Sprintf("Must be between %d and %d years old.", minAge, maxAge),
				),
			}
		}

		return e.Next()
	})

	// The gate has to know whether an address it is given is somebody coming
	// back or somebody new, and it cannot read `users` — that collection only
	// lets a person see their own row. So it asks this, and this answers only
	// yes or no.
	//
	// OPEN: answering it at all tells an unauthenticated caller whether an
	// address has an account here. The alternative is PocketBase's OTP flow,
	// where the server decides and never says; turning that on is what removes
	// this route.
	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		se.Router.GET("/api/alke/account-exists", func(e *core.RequestEvent) error {
			email := strings.TrimSpace(e.Request.URL.Query().Get("email"))
			if email == "" {
				return e.JSON(http.StatusBadRequest, map[string]any{"message": "An address is required."})
			}
			record, err := app.FindAuthRecordByEmail("users", email)
			return e.JSON(http.StatusOK, map[string]any{"exists": err == nil && record != nil})
		})
		// Signing in without a password means the server has to hand out a
		// session to somebody who has proved they own the address. In the real
		// thing that proof is a link they opened. While the app's verification
		// screen is a stand-in, this is its counterpart: it takes an address
		// and returns a session for it.
		//
		// It is an authentication bypass and it knows it. It exists only while
		// ALKE_TEST_SESSIONS is set, it is off by default, and a real magic
		// link replaces both it and the screen that calls it.
		if os.Getenv("ALKE_TEST_SESSIONS") == "1" {
			se.Router.POST("/api/alke/test-session", func(e *core.RequestEvent) error {
				data := struct {
					Email string `json:"email"`
				}{}
				if err := e.BindBody(&data); err != nil {
					return e.JSON(http.StatusBadRequest, map[string]any{"message": "An address is required."})
				}

				record, err := app.FindAuthRecordByEmail("users", strings.TrimSpace(data.Email))
				if err != nil || record == nil {
					return e.JSON(http.StatusNotFound, map[string]any{"message": "No account for that address."})
				}

				token, err := record.NewAuthToken()
				if err != nil {
					return e.JSON(http.StatusInternalServerError, map[string]any{"message": "Could not make a session."})
				}

				return e.JSON(http.StatusOK, map[string]any{
					"token": token,
					"record": map[string]any{
						"id":       record.Id,
						"email":    record.Email(),
						"name":     record.GetString("name"),
						"username": record.GetString("username"),
					},
				})
			})
		}

		return se.Next()
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}

// Whole years from born to now, counting the birthday itself.
func yearsBetween(born, now time.Time) int {
	years := now.Year() - born.Year()
	if now.Month() < born.Month() ||
		(now.Month() == born.Month() && now.Day() < born.Day()) {
		years--
	}
	return years
}
