package main

import (
	"strings"

	"github.com/pocketbase/dbx"
	validation "github.com/pocketbase/ozzo-validation/v4"
	"github.com/pocketbase/pocketbase/core"
)

func bindFavorites(app core.App) {
	// A favorite names an exercise by collection and id, which no relation can
	// check: the exercise has to exist, and be one the person can see — a
	// catalog exercise or their own.
	app.OnRecordValidate("favorite_exercises").BindFunc(func(e *core.RecordEvent) error {
		missing := validation.Errors{
			"exercise": validation.NewError("validation_exercise_not_found", "There is no such exercise."),
		}
		collection := e.Record.GetString("collection")
		if !strings.HasPrefix(collection, "weights_") {
			return missing
		}
		exercise, err := e.App.FindRecordById(collection, e.Record.GetString("exercise"))
		if err != nil {
			return missing
		}
		if owner := exercise.GetString("owner"); owner != "" && owner != e.Record.GetString("user") {
			return missing
		}
		return e.Next()
	})

	// An exercise that goes takes its stars with it.
	app.OnRecordAfterDeleteSuccess().BindFunc(func(e *core.RecordEvent) error {
		if !strings.HasPrefix(e.Record.Collection().Name, "weights_") {
			return e.Next()
		}
		favorites, err := e.App.FindRecordsByFilter(
			"favorite_exercises",
			"collection = {:c} && exercise = {:id}",
			"", 0, 0,
			dbx.Params{"c": e.Record.Collection().Name, "id": e.Record.Id},
		)
		if err != nil {
			return err
		}
		for _, f := range favorites {
			if err := e.App.Delete(f); err != nil {
				return err
			}
		}
		return e.Next()
	})
}
