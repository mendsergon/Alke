package main

import (
	"slices"
	"strings"

	"github.com/pocketbase/dbx"
	validation "github.com/pocketbase/ozzo-validation/v4"
	"github.com/pocketbase/pocketbase/core"
)

func bindExercises(app core.App) {
	// Weight exercises live one collection per category (weights_chest, …).
	// The main muscle is the category's own: its only muscle, or the one
	// chosen from its muscles. What the fields cannot express is that it is
	// not also listed as a secondary one.
	app.OnRecordValidate().BindFunc(func(e *core.RecordEvent) error {
		name := e.Record.Collection().Name
		if !strings.HasPrefix(name, "weights_") {
			return e.Next()
		}
		main, err := mainMuscle(e.App, e.Record)
		if err != nil || main == "" {
			return e.Next() // the main_muscle choice reports a missing one
		}
		if slices.Contains(e.Record.GetStringSlice("secondary_muscles"), main) {
			return validation.Errors{
				"secondary_muscles": validation.NewError("validation_secondary_is_main", "The main muscle is not also a secondary one."),
			}
		}
		return e.Next()
	})
}

// mainMuscle is the id of a weight exercise's main muscle: the one named by
// its main_muscle choice, or its category's only muscle.
func mainMuscle(app core.App, r *core.Record) (string, error) {
	categories, err := app.FindAllRecords("muscle_categories")
	if err != nil {
		return "", err
	}
	for _, c := range categories {
		if "weights_"+strings.ReplaceAll(strings.ToLower(c.GetString("name")), " ", "_") != r.Collection().Name {
			continue
		}
		muscles, err := app.FindRecordsByFilter("muscles", "category = {:c}", "position", 0, 0, dbx.Params{"c": c.Id})
		if err != nil {
			return "", err
		}
		if r.Collection().Fields.GetByName("main_muscle") == nil {
			if len(muscles) == 1 {
				return muscles[0].Id, nil
			}
			return "", nil
		}
		for _, m := range muscles {
			if m.GetString("name") == r.GetString("main_muscle") {
				return m.Id, nil
			}
		}
		return "", nil
	}
	return "", nil
}
