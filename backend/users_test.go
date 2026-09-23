package main

import (
	"net/http"
	"strings"
	"testing"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tests"
)

// subscription_status is the server's alone. No client request may carry it —
// not on registration, not afterwards, not from a superuser — and a new
// account starts free.

func registration(extra string) string {
	return `{"email":"new@alke.test","password":"new-user-password","passwordConfirm":"new-user-password"` + extra + `}`
}

func statusOf(t testing.TB, app core.App, id string) string {
	t.Helper()
	r, err := app.FindRecordById("users", id)
	if err != nil {
		t.Fatal(err)
	}
	return r.GetString("subscription_status")
}

func TestRegistrationStartsFree(t *testing.T) {
	run(t, "a new account starts free", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:          http.MethodPost,
			URL:             "/api/collections/users/records",
			Body:            strings.NewReader(registration("")),
			ExpectedStatus:  200,
			ExpectedContent: []string{`"subscription_status":"free"`},
			AfterTestFunc: func(t testing.TB, app *tests.TestApp, res *http.Response) {
				u, err := app.FindAuthRecordByEmail("users", "new@alke.test")
				if err != nil {
					t.Fatal(err)
				}
				if got := u.GetString("subscription_status"); got != "free" {
					t.Fatalf("new account: got %q, want free", got)
				}
			},
		}
	})
}

func TestRegistrationCannotCarryTheStatus(t *testing.T) {
	for name, extra := range map[string]string{
		"premium":           `,"subscription_status":"premium"`,
		"even free":         `,"subscription_status":"free"`,
		"an appending key":  `,"subscription_status+":"premium"`,
		"a prepending key":  `,"+subscription_status":"premium"`,
		"a subtracting key": `,"subscription_status-":"free"`,
	} {
		run(t, "registration refuses "+name, func(f *fixture) tests.ApiScenario {
			return tests.ApiScenario{
				Method:          http.MethodPost,
				URL:             "/api/collections/users/records",
				Body:            strings.NewReader(registration(extra)),
				ExpectedStatus:  400,
				ExpectedContent: []string{`"status":400`},
				AfterTestFunc: func(t testing.TB, app *tests.TestApp, res *http.Response) {
					if _, err := app.FindAuthRecordByEmail("users", "new@alke.test"); err == nil {
						t.Fatal("the account was created anyway")
					}
				},
			}
		})
	}

	run(t, "registration refuses it as a form field too", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:          http.MethodPost,
			URL:             "/api/collections/users/records",
			Headers:         map[string]string{"Content-Type": "application/x-www-form-urlencoded"},
			Body:            strings.NewReader("email=new%40alke.test&password=new-user-password&passwordConfirm=new-user-password&subscription_status=premium"),
			ExpectedStatus:  400,
			ExpectedContent: []string{`"status":400`},
		}
	})
}

func TestASignedInUserCannotSetTheirStatus(t *testing.T) {
	for name, body := range map[string]string{
		"to premium":              `{"subscription_status":"premium"}`,
		"even to free":            `{"subscription_status":"free"}`,
		"with an appending key":   `{"subscription_status+":"premium"}`,
		"with a prepending key":   `{"+subscription_status":"premium"}`,
		"alongside another field": `{"name":"Alice","subscription_status":"premium"}`,
	} {
		run(t, "a user cannot set themselves "+name, func(f *fixture) tests.ApiScenario {
			return tests.ApiScenario{
				Method:          http.MethodPatch,
				URL:             "/api/collections/users/records/" + f.alice.Id,
				Headers:         auth(f.aliceTok),
				Body:            strings.NewReader(body),
				ExpectedStatus:  400,
				ExpectedContent: []string{`"status":400`},
				AfterTestFunc: func(t testing.TB, app *tests.TestApp, res *http.Response) {
					if got := statusOf(t, app, f.alice.Id); got != "free" {
						t.Fatalf("status after the refused request: got %q, want free", got)
					}
				},
			}
		})
	}

	run(t, "a user still edits their other fields", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:          http.MethodPatch,
			URL:             "/api/collections/users/records/" + f.alice.Id,
			Headers:         auth(f.aliceTok),
			Body:            strings.NewReader(`{"name":"Alice"}`),
			ExpectedStatus:  200,
			ExpectedContent: []string{`"name":"Alice"`},
		}
	})

	run(t, "not even a superuser request sets it", func(f *fixture) tests.ApiScenario {
		return tests.ApiScenario{
			Method:          http.MethodPatch,
			URL:             "/api/collections/users/records/" + f.alice.Id,
			Headers:         auth(f.adminTok),
			Body:            strings.NewReader(`{"subscription_status":"premium"}`),
			ExpectedStatus:  400,
			ExpectedContent: []string{`"status":400`},
		}
	})
}

// Server code is the one writer.
func TestServerCodeSetsTheStatus(t *testing.T) {
	f := newFixture(t)
	defer f.app.Cleanup()

	f.alice.Set("subscription_status", "premium")
	if err := f.app.Save(f.alice); err != nil {
		t.Fatal(err)
	}
	if got := statusOf(t, f.app, f.alice.Id); got != "premium" {
		t.Fatalf("got %q, want premium", got)
	}
}
