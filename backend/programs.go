package main

import (
	"bytes"
	"encoding/json"
	"regexp"
	"strings"

	validation "github.com/pocketbase/ozzo-validation/v4"
	"github.com/pocketbase/pocketbase/core"
)

// A program's week: seven days, Monday first, each one a training day or a
// rest day, the same every week.
var weekdays = []string{"monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"}

const (
	trainingDay = "training"
	restDay     = "rest"
)

// OPEN: no design export draws a workout, so nothing fixes what its icon is.
// These name the split each template's workouts belong to, and the app has
// no drawing for any of them yet.
var workoutIcons = map[string]bool{
	"full_body": true,
	"upper":     true,
	"lower":     true,
	"push":      true,
	"pull":      true,
}

// A workout inside a program: a name, an icon, and the exercises it plans, in
// the order they are done. A workout may plan none yet.
type programWorkout struct {
	Name      string            `json:"name"`
	Icon      string            `json:"icon"`
	Exercises []programExercise `json:"exercises,omitempty"`
}

// An exercise a workout plans: where it lives (exercises are kept one
// collection per category, as favorites name them) and how many sets.
type programExercise struct {
	Collection string `json:"collection"`
	Exercise   string `json:"exercise"`
	Sets       int    `json:"sets"`
}

// The collections weight exercises live in: weights_chest, weights_back, …
var exerciseCollection = regexp.MustCompile(`^weights_[a-z_]+$`)

// One entry per training day, in week order. Rest days have no entry.
type programDay struct {
	Weekday  string           `json:"weekday"`
	Workouts []programWorkout `json:"workouts"`
}

func bindPrograms(app core.App) {
	// A JSON field has no shape of its own, so the week and its days are
	// checked here, on every write, the superuser's included.
	app.OnRecordValidate("programs").BindFunc(func(e *core.RecordEvent) error {
		errs := validation.Errors{}

		schedule, err := checkSchedule(e.Record.GetString("schedule"))
		if err != nil {
			errs["schedule"] = err
		} else if err := checkDays(e.App, e.Record.GetString("days"), schedule, e.Record.GetString("owner")); err != nil {
			errs["days"] = err
		}

		// A template belongs to nobody, so it cannot be anybody's one active
		// program.
		if e.Record.GetBool("active") && e.Record.GetString("owner") == "" {
			errs["active"] = validation.NewError("validation_template_active", "A template cannot be active.")
		}

		if len(errs) > 0 {
			return errs
		}
		return e.Next()
	})
}

func checkSchedule(raw string) ([]string, error) {
	var schedule []string
	if err := strictUnmarshal(raw, &schedule); err != nil || len(schedule) != len(weekdays) {
		return nil, validation.NewError("validation_schedule_week", "Must be seven days, Monday first.")
	}
	for _, d := range schedule {
		if d != trainingDay && d != restDay {
			return nil, validation.NewError("validation_schedule_day", "Each day must be training or rest.")
		}
	}
	return schedule, nil
}

func checkDays(app core.App, raw string, schedule []string, owner string) error {
	var days []programDay
	if err := strictUnmarshal(raw, &days); err != nil {
		return validation.NewError("validation_days_shape", "Each day is a weekday and its workouts, each workout a name, an icon and its exercises.")
	}

	var training []string
	for i, d := range schedule {
		if d == trainingDay {
			training = append(training, weekdays[i])
		}
	}

	if len(days) != len(training) {
		return validation.NewError("validation_days_schedule", "There must be one day for each training day, in week order.")
	}
	for i, d := range days {
		if d.Weekday != training[i] {
			return validation.NewError("validation_days_schedule", "There must be one day for each training day, in week order.")
		}
		if len(d.Workouts) == 0 {
			return validation.NewError("validation_days_empty", "A training day holds at least one workout.")
		}
		for _, w := range d.Workouts {
			if strings.TrimSpace(w.Name) == "" {
				return validation.NewError("validation_workout_name", "A workout needs a name.")
			}
			if !workoutIcons[w.Icon] {
				return validation.NewError("validation_workout_icon", "Unknown workout icon.")
			}
			for _, x := range w.Exercises {
				if err := checkExercise(app, x, owner); err != nil {
					return err
				}
			}
		}
	}
	return nil
}

// A planned exercise is one the program's owner can read: a catalog exercise,
// or a custom one of their own. A template, which has no owner, plans only
// catalog exercises. It has at least one set.
func checkExercise(app core.App, x programExercise, owner string) error {
	if x.Sets < 1 {
		return validation.NewError("validation_exercise_sets", "An exercise has at least one set.")
	}
	if !exerciseCollection.MatchString(x.Collection) || x.Exercise == "" {
		return validation.NewError("validation_exercise_unknown", "Unknown exercise.")
	}
	r, err := app.FindRecordById(x.Collection, x.Exercise)
	if err != nil {
		return validation.NewError("validation_exercise_unknown", "Unknown exercise.")
	}
	if o := r.GetString("owner"); o != "" && o != owner {
		return validation.NewError("validation_exercise_unknown", "Unknown exercise.")
	}
	return nil
}

// Anything beyond the fields above is refused rather than carried along.
func strictUnmarshal(raw string, into any) error {
	dec := json.NewDecoder(bytes.NewReader([]byte(raw)))
	dec.DisallowUnknownFields()
	if err := dec.Decode(into); err != nil {
		return err
	}
	if dec.More() {
		return validation.NewError("validation_json_trailing", "Unexpected trailing data.")
	}
	return nil
}
