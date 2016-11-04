defmodule Draw.CanvasTest do
  use Draw.ModelCase

  alias Draw.Canvas

  @valid_attrs %{title: "some content"}
  @invalid_attrs %{}

  test "changeset with valid attributes" do
    changeset = Canvas.changeset(%Canvas{}, @valid_attrs)
    assert changeset.valid?
  end

  test "changeset with invalid attributes" do
    changeset = Canvas.changeset(%Canvas{}, @invalid_attrs)
    refute changeset.valid?
  end
end
