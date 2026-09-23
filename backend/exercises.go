package main

import (
	"encoding/json"

	validation "github.com/pocketbase/ozzo-validation/v4"
	"github.com/pocketbase/pocketbase/core"
)

const (
	primaryMuscle   = "primary"
	secondaryMuscle = "secondary"
)

// One muscle an exercise trains, and whether it is primary or secondary for it.
type exerciseMuscle struct {
	Muscle string `json:"muscle"`
	Role   string `json:"role"`
}

func bindExercises(app core.App) {
	// A JSON field has no shape of its own, so the muscles are checked here,
	// on every write: at least one, each one a muscle some category covers,
	// each primary or secondary, none twice.
	app.OnRecordValidate("exercises").BindFunc(func(e *core.RecordEvent) error {
		var muscles []exerciseMuscle
		if err := strictUnmarshal(e.Record.GetString("muscles"), &muscles); err != nil {
			return validation.Errors{"muscles": validation.NewError("validation_muscles_shape", "Each muscle is a muscle and a role.")}
		}
		if len(muscles) == 0 {
			return validation.Errors{"muscles": validation.NewError("validation_muscles_empty", "An exercise trains at least one muscle.")}
		}

		known, err := knownMuscles(e.App)
		if err != nil {
			return err
		}
		seen := map[string]bool{}
		for _, m := range muscles {
			if !known[m.Muscle] {
				return validation.Errors{"muscles": validation.NewError("validation_muscle_unknown", "Unknown muscle.")}
			}
			if m.Role != primaryMuscle && m.Role != secondaryMuscle {
				return validation.Errors{"muscles": validation.NewError("validation_muscle_role", "Each muscle is primary or secondary.")}
			}
			if seen[m.Muscle] {
				return validation.Errors{"muscles": validation.NewError("validation_muscle_twice", "A muscle appears once.")}
			}
			seen[m.Muscle] = true
		}
		return e.Next()
	})
}

// Every muscle some category covers.
func knownMuscles(app core.App) (map[string]bool, error) {
	categories, err := app.FindAllRecords("muscle_categories")
	if err != nil {
		return nil, err
	}
	known := map[string]bool{}
	for _, c := range categories {
		var muscles []string
		if err := json.Unmarshal([]byte(c.GetString("muscles")), &muscles); err != nil {
			return nil, err
		}
		for _, m := range muscles {
			known[m] = true
		}
	}
	return known, nil
}
