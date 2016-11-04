defmodule Draw.Repo.Migrations.CreateCanvas do
  use Ecto.Migration

  def change do
    create table(:canvases) do
      add :title, :string, null: false

      timestamps()
    end

  end
end
