package main

import (
	"net/http"
	"strings"
	"testing"

	"github.com/pocketbase/pocketbase/tests"
)

func publish(t *testing.T, f *fixture) {
	t.Helper()
	f.bobsCopy.Set("published", true)
	if err := f.app.Save(f.bobsCopy); err != nil {
		t.Fatal(err)
	}
}

func TestPublishedPrograms(t *testing.T) {
	run(t, "the owner publishes their program", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:          http.MethodPatch,
			URL:             "/api/collections/programs/records/" + f.bobsCopy.Id,
			Headers:         auth(f.bobTok),
			Body:            strings.NewReader(`{"published":true}`),
			ExpectedStatus:  200,
			ExpectedContent: []string{`"published":true`},
		}
	})

	run(t, "an unpublished program stays private", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:          http.MethodGet,
			URL:             "/api/collections/programs/records/" + f.bobsCopy.Id,
			Headers:         auth(f.aliceTok),
			ExpectedStatus:  404,
			ExpectedContent: []string{`"status":404`},
		}
	})

	run(t, "another user reads a published program", func(f *fixture) tests.ApiScenario {
		publish(t, f)
		return tests.ApiScenario{
			Method:          http.MethodGet,
			URL:             "/api/collections/programs/records/" + f.bobsCopy.Id,
			Headers:         auth(f.aliceTok),
			ExpectedStatus:  200,
			ExpectedContent: []string{f.bobsCopy.Id},
		}
	})

	run(t, "a guest cannot read a published program", func(f *fixture) tests.ApiScenario {
		publish(t, f)
		return tests.ApiScenario{
			Method:          http.MethodGet,
			URL:             "/api/collections/programs/records/" + f.bobsCopy.Id,
			ExpectedStatus:  404,
			ExpectedContent: []string{`"status":404`},
		}
	})

	run(t, "another user duplicates a published program", func(f *fixture) tests.ApiScenario {
		publish(t, f)
		body := `{"name":"Copy","owner":"` + f.alice.Id + `","copied_from":"` + f.bobsCopy.Id + `","schedule":` +
			f.bobsCopy.GetString("schedule") + `,"days":` + f.bobsCopy.GetString("days") + `}`
		return tests.ApiScenario{
			Method:          http.MethodPost,
			URL:             "/api/collections/programs/records",
			Headers:         auth(f.aliceTok),
			Body:            strings.NewReader(body),
			ExpectedStatus:  200,
			ExpectedContent: []string{`"owner":"` + f.alice.Id + `"`},
		}
	})

	run(t, "another user cannot change a published program", func(f *fixture) tests.ApiScenario {
		publish(t, f)
		return tests.ApiScenario{
			Method:          http.MethodPatch,
			URL:             "/api/collections/programs/records/" + f.bobsCopy.Id,
			Headers:         auth(f.aliceTok),
			Body:            strings.NewReader(`{"name":"Taken"}`),
			ExpectedStatus:  404,
			ExpectedContent: []string{`"status":404`},
		}
	})

	run(t, "another user cannot delete a published program", func(f *fixture) tests.ApiScenario {
		publish(t, f)
		return tests.ApiScenario{
			Method:          http.MethodDelete,
			URL:             "/api/collections/programs/records/" + f.bobsCopy.Id,
			Headers:         auth(f.aliceTok),
			ExpectedStatus:  404,
			ExpectedContent: []string{`"status":404`},
		}
	})
}

func TestATemplateIsNeverPublished(t *testing.T) {
	f := newFixture(t)
	defer f.app.Cleanup()
	f.template.Set("published", true)
	if err := f.app.Save(f.template); err == nil {
		t.Fatal("a published template was accepted")
	}
}
