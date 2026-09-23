package main

import (
	"slices"

	validation "github.com/pocketbase/ozzo-validation/v4"
	"github.com/pocketbase/pocketbase/core"
)

func bindExercises(app core.App) {
	// The relations check that every muscle is a category and the type
	// exists; the one rule they cannot express is that the main muscle is not
	// also listed as a secondary one.
	app.OnRecordValidate("exercises").BindFunc(func(e *core.RecordEvent) error {
		main := e.Record.GetString("main_muscle")
		if main != "" && slices.Contains(e.Record.GetStringSlice("secondary_muscles"), main) {
			return validation.Errors{
				"secondary_muscles": validation.NewError("validation_secondary_is_main", "The main muscle is not also a secondary one."),
			}
		}
		return e.Next()
	})
}
