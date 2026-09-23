package migrations

import (
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

// Copies saved while a template carried its first, wrong name carry that name
// too. This corrects them once: a copy is renamed only when it still has
// exactly the old name and still points at the template it came from, so a
// copy the person named themselves is left alone. Later edits to a template
// still never reach its copies.
func init() {
	m.Register(func(app core.App) error {
		return renameCopies(app)
	}, nil)
}

func renameCopies(app core.App) error {
	for was, now := range templateRenames {
		templates, err := app.FindRecordsByFilter("programs", "owner = '' && name = {:name}", "", 0, 0, dbx.Params{"name": now})
		if err != nil {
			return err
		}
		for _, tpl := range templates {
			copies, err := app.FindRecordsByFilter("programs", "owner != '' && copied_from = {:tpl} && name = {:was}", "", 0, 0, dbx.Params{"tpl": tpl.Id, "was": was})
			if err != nil {
				return err
			}
			for _, c := range copies {
				c.Set("name", now)
				if err := app.Save(c); err != nil {
					return err
				}
			}
		}
	}
	return nil
}
