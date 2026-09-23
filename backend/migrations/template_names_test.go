package migrations

import (
	"os"
	"strings"
	"testing"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/tests"
)

// A database that applied the first seed holds the old names. The rename has
// to bring it to the same state a fresh database is seeded in.
func TestRenameTemplates(t *testing.T) {
	dir, err := os.MkdirTemp("", "alke_rename_*")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(dir)

	app, err := tests.NewTestApp(dir)
	if err != nil {
		t.Fatal(err)
	}
	defer app.Cleanup()

	// Put the templates back the way the first seed wrote them.
	old := map[string]string{
		"Full Body":           "Full body",
		"Upper / Lower":       "Upper / lower",
		"Push / Pull / Lower": "Push / pull / legs",
	}
	for now, was := range old {
		r, err := app.FindFirstRecordByFilter("programs", "owner = '' && name = {:n}", dbx.Params{"n": now})
		if err != nil {
			t.Fatalf("%s: %v", now, err)
		}
		r.Set("name", was)
		if was == "Push / pull / legs" {
			r.Set("days", strings.NewReplacer(`"name":"Lower","icon":"lower"`, `"name":"Legs","icon":"legs"`).Replace(r.GetString("days")))
		}
		if err := app.Save(r); err != nil {
			t.Fatal(err)
		}
	}

	if err := renameTemplates(app); err != nil {
		t.Fatal(err)
	}

	for now := range old {
		r, err := app.FindFirstRecordByFilter("programs", "owner = '' && name = {:n}", dbx.Params{"n": now})
		if err != nil {
			t.Fatalf("%s missing after the rename: %v", now, err)
		}
		if strings.Contains(strings.ToLower(r.GetString("days")), "legs") {
			t.Fatalf("%s still has legs: %s", now, r.GetString("days"))
		}
	}

	// Running it on a database that is already right changes nothing.
	if err := renameTemplates(app); err != nil {
		t.Fatal(err)
	}
	all, _ := app.FindRecordsByFilter("programs", "owner = ''", "", 0, 0)
	if len(all) != 3 {
		t.Fatalf("templates: got %d, want 3", len(all))
	}
}
