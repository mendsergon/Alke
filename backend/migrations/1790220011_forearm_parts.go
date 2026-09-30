package migrations

import (
	"fmt"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

// Forearms is three muscles, not one (Stavros, 30 September 2026): the
// extending side, the curling side and the brachialis on the upper arm. So
// weights_forearms offers them as its main-muscle choice, as Back does.
//
// The one Forearms muscle becomes the curling side, keeping its id, so an
// exercise that had it keeps a muscle.
func init() {
	m.Register(func(app core.App) error {
		category, err := app.FindFirstRecordByFilter("muscle_categories", "name = 'Forearms'")
		if err != nil {
			return err
		}
		muscles, err := app.FindCollectionByNameOrId("muscles")
		if err != nil {
			return err
		}
		want := []string{"Forearm extensors", "Forearm flexors", "Brachialis"}
		for i, name := range want {
			r, err := app.FindFirstRecordByFilter("muscles", "category = {:c} && name = {:n}", dbx.Params{"c": category.Id, "n": name})
			if err != nil && name == "Forearm flexors" {
				r, err = app.FindFirstRecordByFilter("muscles", "category = {:c} && name = 'Forearms'", dbx.Params{"c": category.Id})
			}
			if err != nil {
				r = core.NewRecord(muscles)
				r.Set("category", category.Id)
			}
			r.Set("name", name)
			r.Set("figure", name) // the body figure's name for its regions
			r.Set("position", i+1)
			if err := app.Save(r); err != nil {
				return fmt.Errorf("%s: %w", name, err)
			}
		}

		col, err := app.FindCollectionByNameOrId(WeightsCollection("Forearms"))
		if err != nil {
			return err
		}
		if col.Fields.GetByName("main_muscle") != nil {
			return nil
		}
		col.Fields.Add(&core.SelectField{
			Name:      "main_muscle",
			Values:    want,
			MaxSelect: 1,
			Required:  true,
			Help:      "The muscle it trains most. The icon it is drawn with comes from this.",
		})
		col.AddIndex("idx_"+col.Name+"_main_muscle", false, "main_muscle", "")
		if err := app.Save(col); err != nil {
			return err
		}
		// Until now every forearm exercise's main muscle was the one Forearms
		// muscle, which is the curling side now.
		records, err := app.FindAllRecords(col)
		if err != nil {
			return err
		}
		for _, r := range records {
			r.Set("main_muscle", "Forearm flexors")
			if err := app.Save(r); err != nil {
				return fmt.Errorf("%s: %w", r.GetString("name"), err)
			}
		}
		return nil
	}, nil)
}
