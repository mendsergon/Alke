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
	// The main muscles are the category's own: its only muscle, the one
	// chosen from its muscles, or every one ticked. What the fields cannot
	// express is that at least one is ticked, and that none is also listed as
	// a secondary one.
	app.OnRecordValidate().BindFunc(func(e *core.RecordEvent) error {
		name := e.Record.Collection().Name
		if !strings.HasPrefix(name, "weights_") {
			return e.Next()
		}
		main, checkboxes, err := mainMuscles(e.App, e.Record)
		if err != nil {
			return e.Next()
		}
		if len(main) == 0 && len(checkboxes) > 0 {
			return validation.Errors{
				checkboxes[0]: validation.NewError("validation_main_muscle_required", "Tick at least one main muscle."),
			}
		}
		for _, m := range main {
			if slices.Contains(e.Record.GetStringSlice("secondary_muscles"), m) {
				return validation.Errors{
					"secondary_muscles": validation.NewError("validation_secondary_is_main", "A main muscle is not also a secondary one."),
				}
			}
		}
		return e.Next()
	})
}

// mainMuscles are the ids of a weight exercise's main muscles: the one named
// by its main_muscle choice, every one whose checkbox is ticked, or its
// category's only muscle. checkboxes names the checkbox fields, when the
// collection has them.
func mainMuscles(app core.App, r *core.Record) (main []string, checkboxes []string, err error) {
	categories, err := app.FindAllRecords("muscle_categories")
	if err != nil {
		return nil, nil, err
	}
	for _, c := range categories {
		if "weights_"+strings.ReplaceAll(strings.ToLower(c.GetString("name")), " ", "_") != r.Collection().Name {
			continue
		}
		muscles, err := app.FindRecordsByFilter("muscles", "category = {:c}", "position", 0, 0, dbx.Params{"c": c.Id})
		if err != nil {
			return nil, nil, err
		}
		fields := r.Collection().Fields
		if fields.GetByName("main_muscle") != nil {
			for _, m := range muscles {
				if m.GetString("name") == r.GetString("main_muscle") {
					return []string{m.Id}, nil, nil
				}
			}
			return nil, nil, nil
		}
		if len(muscles) == 1 {
			return []string{muscles[0].Id}, nil, nil
		}
		for _, m := range muscles {
			field := strings.ReplaceAll(strings.ToLower(m.GetString("name")), " ", "_")
			if _, ok := fields.GetByName(field).(*core.BoolField); !ok {
				continue
			}
			checkboxes = append(checkboxes, field)
			if r.GetBool(field) {
				main = append(main, m.Id)
			}
		}
		return main, checkboxes, nil
	}
	return nil, nil, nil
}
