package main

import (
	"slices"
	"strings"

	validation "github.com/pocketbase/ozzo-validation/v4"
	"github.com/pocketbase/pocketbase/core"
)

func bindExercises(app core.App) {
	// Weight exercises live one collection per category (weights_chest, …).
	// The relations check that every muscle is one of the muscles and the type
	// exists; what they cannot express is that the main muscle belongs to the
	// collection's category, and that it is not also listed as a secondary one.
	app.OnRecordValidate().BindFunc(func(e *core.RecordEvent) error {
		name := e.Record.Collection().Name
		if !strings.HasPrefix(name, "weights_") {
			return e.Next()
		}
		main := e.Record.GetString("main_muscle")
		if main == "" {
			return e.Next()
		}
		if slices.Contains(e.Record.GetStringSlice("secondary_muscles"), main) {
			return validation.Errors{
				"secondary_muscles": validation.NewError("validation_secondary_is_main", "The main muscle is not also a secondary one."),
			}
		}
		muscle, err := e.App.FindRecordById("muscles", main)
		if err != nil {
			return e.Next() // the relation reports a muscle that does not exist
		}
		category, err := e.App.FindRecordById("muscle_categories", muscle.GetString("category"))
		if err != nil || "weights_"+strings.ReplaceAll(strings.ToLower(category.GetString("name")), " ", "_") != name {
			return validation.Errors{
				"main_muscle": validation.NewError("validation_main_muscle_elsewhere", "The main muscle belongs to another category's collection."),
			}
		}
		return e.Next()
	})
}
