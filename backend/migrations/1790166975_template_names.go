package migrations

import (
	"strings"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

// The first seed wrote the template names in sentence case and called the
// third template's lower-body day "Legs". This brings a database that applied
// it to what the seed now writes. On a fresh database it finds nothing to do.
func init() {
	m.Register(func(app core.App) error {
		return renameTemplates(app)
	}, nil)
}

var templateRenames = map[string]string{
	"Full body":          "Full Body",
	"Upper / lower":      "Upper / Lower",
	"Push / pull / legs": "Push / Pull / Lower",
}

func renameTemplates(app core.App) error {
	for was, now := range templateRenames {
		records, err := app.FindRecordsByFilter("programs", "owner = '' && name = {:name}", "", 0, 0, dbx.Params{"name": was})
		if err != nil {
			return err
		}
		for _, r := range records {
			r.Set("name", now)
			r.Set("days", strings.ReplaceAll(r.GetString("days"), `"name":"Legs","icon":"legs"`, `"name":"Lower","icon":"lower"`))
			if err := app.Save(r); err != nil {
				return err
			}
		}
	}
	return nil
}
