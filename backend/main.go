package main

import (
	"fmt"
	"log"
	"time"

	validation "github.com/pocketbase/ozzo-validation/v4"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

// The range a date of birth has to put an account in, in whole years.
const (
	minAge = 15
	maxAge = 100
)

func main() {
	app := pocketbase.New()

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
