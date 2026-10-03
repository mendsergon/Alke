package main

import (
	"encoding/json"
	"net/http"
	"strings"
	"testing"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tests"
)

func favoriteBody(user, collection, exercise string) string {
	b, _ := json.Marshal(map[string]string{"user": user, "collection": collection, "exercise": exercise})
	return string(b)
}

func saveFavorite(t testing.TB, app core.App, user, collection, exercise string) *core.Record {
	t.Helper()
	col, _ := app.FindCollectionByNameOrId("favorite_exercises")
	r := core.NewRecord(col)
	r.Set("user", user)
	r.Set("collection", collection)
	r.Set("exercise", exercise)
	if err := app.Save(r); err != nil {
		t.Fatal(err)
	}
	return r
}

func TestFavoriteRules(t *testing.T) {
	run(t, "a user stars a catalog exercise", func(f *fixture) tests.ApiScenario {
		ex := saveExercise(t, f.app, "")
		return tests.ApiScenario{
			Method:          http.MethodPost,
			URL:             "/api/collections/favorite_exercises/records",
			Headers:         auth(f.aliceTok),
			Body:            strings.NewReader(favoriteBody(f.alice.Id, "weights_chest", ex.Id)),
			ExpectedStatus:  200,
			ExpectedContent: []string{`"exercise":"` + ex.Id + `"`},
		}
	})
	run(t, "a user stars their own exercise", func(f *fixture) tests.ApiScenario {
		ex := saveExercise(t, f.app, f.alice.Id)
		return tests.ApiScenario{
			Method:          http.MethodPost,
			URL:             "/api/collections/favorite_exercises/records",
			Headers:         auth(f.aliceTok),
			Body:            strings.NewReader(favoriteBody(f.alice.Id, "weights_chest", ex.Id)),
			ExpectedStatus:  200,
			ExpectedContent: []string{`"exercise":"` + ex.Id + `"`},
		}
	})
	run(t, "an exercise is starred once", func(f *fixture) tests.ApiScenario {
		ex := saveExercise(t, f.app, "")
		saveFavorite(t, f.app, f.alice.Id, "weights_chest", ex.Id)
		return tests.ApiScenario{
			Method:          http.MethodPost,
			URL:             "/api/collections/favorite_exercises/records",
			Headers:         auth(f.aliceTok),
			Body:            strings.NewReader(favoriteBody(f.alice.Id, "weights_chest", ex.Id)),
			ExpectedStatus:  400,
			ExpectedContent: []string{`"status":400`},
		}
	})
	run(t, "a guest cannot star", func(f *fixture) tests.ApiScenario {
		ex := saveExercise(t, f.app, "")
		return tests.ApiScenario{
			Method:          http.MethodPost,
			URL:             "/api/collections/favorite_exercises/records",
			Body:            strings.NewReader(favoriteBody(f.alice.Id, "weights_chest", ex.Id)),
			ExpectedStatus:  400,
			ExpectedContent: []string{`"status":400`},
		}
	})
	run(t, "a user cannot star for someone else", func(f *fixture) tests.ApiScenario {
		ex := saveExercise(t, f.app, "")
		return tests.ApiScenario{
			Method:          http.MethodPost,
			URL:             "/api/collections/favorite_exercises/records",
			Headers:         auth(f.aliceTok),
			Body:            strings.NewReader(favoriteBody(f.bob.Id, "weights_chest", ex.Id)),
			ExpectedStatus:  400,
			ExpectedContent: []string{`"status":400`},
		}
	})
	run(t, "an exercise that does not exist cannot be starred", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:          http.MethodPost,
			URL:             "/api/collections/favorite_exercises/records",
			Headers:         auth(f.aliceTok),
			Body:            strings.NewReader(favoriteBody(f.alice.Id, "weights_chest", "nosuchexercise1")),
			ExpectedStatus:  400,
			ExpectedContent: []string{`"validation_exercise_not_found"`},
		}
	})
	run(t, "a collection that is not an exercise collection is refused", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:          http.MethodPost,
			URL:             "/api/collections/favorite_exercises/records",
			Headers:         auth(f.aliceTok),
			Body:            strings.NewReader(favoriteBody(f.alice.Id, "users", f.bob.Id)),
			ExpectedStatus:  400,
			ExpectedContent: []string{`"status":400`},
		}
	})
	run(t, "someone else's own exercise cannot be starred", func(f *fixture) tests.ApiScenario {
		ex := saveExercise(t, f.app, f.bob.Id)
		return tests.ApiScenario{
			Method:          http.MethodPost,
			URL:             "/api/collections/favorite_exercises/records",
			Headers:         auth(f.aliceTok),
			Body:            strings.NewReader(favoriteBody(f.alice.Id, "weights_chest", ex.Id)),
			ExpectedStatus:  400,
			ExpectedContent: []string{`"validation_exercise_not_found"`},
		}
	})
	run(t, "a user lists only their own stars", func(f *fixture) tests.ApiScenario {
		ex := saveExercise(t, f.app, "")
		mine := saveFavorite(t, f.app, f.alice.Id, "weights_chest", ex.Id)
		theirs := saveFavorite(t, f.app, f.bob.Id, "weights_chest", ex.Id)
		return tests.ApiScenario{
			Method:             http.MethodGet,
			URL:                "/api/collections/favorite_exercises/records",
			Headers:            auth(f.aliceTok),
			ExpectedStatus:     200,
			ExpectedContent:    []string{`"totalItems":1`, mine.Id},
			NotExpectedContent: []string{theirs.Id},
		}
	})
	run(t, "a user unstars", func(f *fixture) tests.ApiScenario {
		ex := saveExercise(t, f.app, "")
		mine := saveFavorite(t, f.app, f.alice.Id, "weights_chest", ex.Id)
		return tests.ApiScenario{
			Method:         http.MethodDelete,
			URL:            "/api/collections/favorite_exercises/records/" + mine.Id,
			Headers:        auth(f.aliceTok),
			ExpectedStatus: 204,
		}
	})
	run(t, "a user cannot remove someone else's star", func(f *fixture) tests.ApiScenario {
		ex := saveExercise(t, f.app, "")
		theirs := saveFavorite(t, f.app, f.bob.Id, "weights_chest", ex.Id)
		return tests.ApiScenario{
			Method:          http.MethodDelete,
			URL:             "/api/collections/favorite_exercises/records/" + theirs.Id,
			Headers:         auth(f.aliceTok),
			ExpectedStatus:  404,
			ExpectedContent: []string{`"status":404`},
		}
	})
	run(t, "a star is not edited", func(f *fixture) tests.ApiScenario {
		ex := saveExercise(t, f.app, "")
		mine := saveFavorite(t, f.app, f.alice.Id, "weights_chest", ex.Id)
		return tests.ApiScenario{
			Method:          http.MethodPatch,
			URL:             "/api/collections/favorite_exercises/records/" + mine.Id,
			Headers:         auth(f.aliceTok),
			Body:            strings.NewReader(`{"exercise":"other"}`),
			ExpectedStatus:  403,
			ExpectedContent: []string{`"status":403`},
		}
	})
}

func TestDeletingAnExerciseRemovesItsStars(t *testing.T) {
	f := newFixture(t)
	defer f.app.Cleanup()

	ex := saveExercise(t, f.app, "")
	star := saveFavorite(t, f.app, f.alice.Id, "weights_chest", ex.Id)
	if err := f.app.Delete(ex); err != nil {
		t.Fatal(err)
	}
	if _, err := f.app.FindRecordById("favorite_exercises", star.Id); err == nil {
		t.Fatal("the deleted exercise's star is still there")
	}
}
