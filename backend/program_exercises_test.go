package main

import (
	"encoding/json"
	"net/http"
	"strings"
	"testing"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tests"
)

// A program's days with one workout planning the given exercise, for each
// training day of the fixture's Full Body copy.
func daysPlanning(t testing.TB, program *core.Record, collection, exercise string, sets int) string {
	t.Helper()
	var days []programDay
	if err := json.Unmarshal([]byte(program.GetString("days")), &days); err != nil {
		t.Fatal(err)
	}
	for d := range days {
		for w := range days[d].Workouts {
			days[d].Workouts[w].Exercises = []programExercise{{Collection: collection, Exercise: exercise, Sets: sets}}
		}
	}
	b, _ := json.Marshal(map[string]any{"days": days})
	return string(b)
}

func TestProgramExercises(t *testing.T) {
	run(t, "the owner plans a catalog exercise in their copy", func(f *fixture) tests.ApiScenario {
		ex := saveExercise(t, f.app, "")
		return tests.ApiScenario{
			Method:          http.MethodPatch,
			URL:             "/api/collections/programs/records/" + f.bobsCopy.Id,
			Headers:         auth(f.bobTok),
			Body:            strings.NewReader(daysPlanning(t, f.bobsCopy, "weights_chest", ex.Id, 1)),
			ExpectedStatus:  200,
			ExpectedContent: []string{`"exercise":"` + ex.Id + `"`, `"sets":1`},
		}
	})

	run(t, "the owner plans their own custom exercise", func(f *fixture) tests.ApiScenario {
		ex := saveExercise(t, f.app, f.bob.Id)
		return tests.ApiScenario{
			Method:          http.MethodPatch,
			URL:             "/api/collections/programs/records/" + f.bobsCopy.Id,
			Headers:         auth(f.bobTok),
			Body:            strings.NewReader(daysPlanning(t, f.bobsCopy, "weights_chest", ex.Id, 2)),
			ExpectedStatus:  200,
			ExpectedContent: []string{`"exercise":"` + ex.Id + `"`},
		}
	})

	run(t, "the owner cannot plan another user's custom exercise", func(f *fixture) tests.ApiScenario {
		ex := saveExercise(t, f.app, f.alice.Id)
		return tests.ApiScenario{
			Method:          http.MethodPatch,
			URL:             "/api/collections/programs/records/" + f.bobsCopy.Id,
			Headers:         auth(f.bobTok),
			Body:            strings.NewReader(daysPlanning(t, f.bobsCopy, "weights_chest", ex.Id, 1)),
			ExpectedStatus:  400,
			ExpectedContent: []string{`validation_exercise_unknown`},
		}
	})

	run(t, "an exercise that does not exist is refused", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:          http.MethodPatch,
			URL:             "/api/collections/programs/records/" + f.bobsCopy.Id,
			Headers:         auth(f.bobTok),
			Body:            strings.NewReader(daysPlanning(t, f.bobsCopy, "weights_chest", "nosuchexercise1", 1)),
			ExpectedStatus:  400,
			ExpectedContent: []string{`validation_exercise_unknown`},
		}
	})

	run(t, "a collection that is not an exercise collection is refused", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:          http.MethodPatch,
			URL:             "/api/collections/programs/records/" + f.bobsCopy.Id,
			Headers:         auth(f.bobTok),
			Body:            strings.NewReader(daysPlanning(t, f.bobsCopy, "users", f.bob.Id, 1)),
			ExpectedStatus:  400,
			ExpectedContent: []string{`validation_exercise_unknown`},
		}
	})

	run(t, "an exercise has at least one set", func(f *fixture) tests.ApiScenario {
		ex := saveExercise(t, f.app, "")
		return tests.ApiScenario{
			Method:          http.MethodPatch,
			URL:             "/api/collections/programs/records/" + f.bobsCopy.Id,
			Headers:         auth(f.bobTok),
			Body:            strings.NewReader(daysPlanning(t, f.bobsCopy, "weights_chest", ex.Id, 0)),
			ExpectedStatus:  400,
			ExpectedContent: []string{`validation_exercise_sets`},
		}
	})

	run(t, "another user cannot plan exercises in someone's copy", func(f *fixture) tests.ApiScenario {
		ex := saveExercise(t, f.app, "")
		return tests.ApiScenario{
			Method:          http.MethodPatch,
			URL:             "/api/collections/programs/records/" + f.bobsCopy.Id,
			Headers:         auth(f.aliceTok),
			Body:            strings.NewReader(daysPlanning(t, f.bobsCopy, "weights_chest", ex.Id, 1)),
			ExpectedStatus:  404,
			ExpectedContent: []string{`"status":404`},
		}
	})

	run(t, "a user cannot plan exercises in a template", func(f *fixture) tests.ApiScenario {
		ex := saveExercise(t, f.app, "")
		return tests.ApiScenario{
			Method:          http.MethodPatch,
			URL:             "/api/collections/programs/records/" + f.template.Id,
			Headers:         auth(f.bobTok),
			Body:            strings.NewReader(daysPlanning(t, f.template, "weights_chest", ex.Id, 1)),
			ExpectedStatus:  404,
			ExpectedContent: []string{`"status":404`},
		}
	})
}

// Saving a template copies its planned exercises into the person's own row;
// planning more in the copy afterwards leaves the template as it was.
func TestCopyCarriesPlannedExercises(t *testing.T) {
	f := newFixture(t)
	defer f.app.Cleanup()

	ex := saveExercise(t, f.app, "")
	var body map[string]any
	if err := json.Unmarshal([]byte(daysPlanning(t, f.template, "weights_chest", ex.Id, 1)), &body); err != nil {
		t.Fatal(err)
	}
	f.template.Set("days", body["days"])
	if err := f.app.Save(f.template); err != nil {
		t.Fatal(err)
	}

	copy := saveCopy(t, f.app, f.template, f.alice)
	if !strings.Contains(copy.GetString("days"), ex.Id) {
		t.Fatalf("the copy does not plan the template's exercise: %s", copy.GetString("days"))
	}

	other := saveExercise(t, f.app, "")
	if err := json.Unmarshal([]byte(daysPlanning(t, copy, "weights_chest", other.Id, 1)), &body); err != nil {
		t.Fatal(err)
	}
	copy.Set("days", body["days"])
	if err := f.app.Save(copy); err != nil {
		t.Fatal(err)
	}

	template, err := f.app.FindRecordById("programs", f.template.Id)
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(template.GetString("days"), other.Id) {
		t.Fatal("editing the copy reached the template")
	}
}
