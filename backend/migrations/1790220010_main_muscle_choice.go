package migrations

import (
	"fmt"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

// A weights collection offers as main muscle only its own category's muscles
// (Stavros, 30 September 2026): Back picks from Lats, Traps and Erectors, and
// Chest, whose only muscle is Pecs, has nothing to pick at all.
//
//   - A category with one muscle: no main_muscle field; its muscle is the
//     main one.
//   - A category with several: main_muscle is a choice of their names, in
//     the muscles' order. A relation cannot narrow the records it offers,
//     so a choice it is.
//
// A main muscle already set is carried over by name.
func init() {
	m.Register(func(app core.App) error {
		categories, err := app.FindRecordsByFilter("muscle_categories", "", "position", 0, 0)
		if err != nil {
			return err
		}
		for _, c := range categories {
			col, err := app.FindCollectionByNameOrId(WeightsCollection(c.GetString("name")))
			if err != nil {
				return err
			}
			if _, ok := col.Fields.GetByName("main_muscle").(*core.RelationField); !ok {
				continue // already a choice, or already gone
			}
			muscles, err := app.FindRecordsByFilter("muscles", "category = {:c}", "position", 0, 0, dbx.Params{"c": c.Id})
			if err != nil {
				return err
			}
			names := make([]string, 0, len(muscles))
			nameOf := map[string]string{}
			for _, mu := range muscles {
				names = append(names, mu.GetString("name"))
				nameOf[mu.Id] = mu.GetString("name")
			}

			records, err := app.FindAllRecords(col)
			if err != nil {
				return err
			}
			main := map[string]string{}
			for _, r := range records {
				main[r.Id] = nameOf[r.GetString("main_muscle")]
			}

			index := "idx_" + col.Name + "_main_muscle"
			col.RemoveIndex(index)
			col.Fields.RemoveByName("main_muscle")
			if err := app.Save(col); err != nil {
				return fmt.Errorf("%s: %w", col.Name, err)
			}
			if len(names) < 2 {
				continue
			}

			col.Fields.Add(&core.SelectField{
				Name:      "main_muscle",
				Values:    names,
				MaxSelect: 1,
				Required:  true,
				Help:      "The muscle it trains most. The icon it is drawn with comes from this.",
			})
			col.AddIndex(index, false, "main_muscle", "")
			if err := app.Save(col); err != nil {
				return fmt.Errorf("%s: %w", col.Name, err)
			}
			for _, r := range records {
				r.Set("main_muscle", main[r.Id])
				if err := app.Save(r); err != nil {
					return fmt.Errorf("%s: %w", r.GetString("name"), err)
				}
			}
		}
		return nil
	}, nil)
}
