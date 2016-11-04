defmodule Draw.CanvasControllerTest do
  use Draw.ConnCase

  alias Draw.Canvas
  @valid_attrs %{title: "some content"}
  @invalid_attrs %{}

  test "lists all entries on index", %{conn: conn} do
    conn = get conn, canvas_path(conn, :index)
    assert html_response(conn, 200) =~ "Listing canvases"
  end

  test "renders form for new resources", %{conn: conn} do
    conn = get conn, canvas_path(conn, :new)
    assert html_response(conn, 200) =~ "New canvas"
  end

  test "creates resource and redirects when data is valid", %{conn: conn} do
    conn = post conn, canvas_path(conn, :create), canvas: @valid_attrs
    assert redirected_to(conn) == canvas_path(conn, :index)
    assert Repo.get_by(Canvas, @valid_attrs)
  end

  test "does not create resource and renders errors when data is invalid", %{conn: conn} do
    conn = post conn, canvas_path(conn, :create), canvas: @invalid_attrs
    assert html_response(conn, 200) =~ "New canvas"
  end

  test "shows chosen resource", %{conn: conn} do
    canvas = Repo.insert! %Canvas{title: "sfsdf"}
    conn = get conn, canvas_path(conn, :show, canvas)
    assert html_response(conn, 200) =~ canvas.title
  end

  test "renders page not found when id is nonexistent", %{conn: conn} do
    assert_error_sent 404, fn ->
      get conn, canvas_path(conn, :show, -1)
    end
  end

  test "renders form for editing chosen resource", %{conn: conn} do
    canvas = Repo.insert! %Canvas{}
    conn = get conn, canvas_path(conn, :edit, canvas)
    assert html_response(conn, 200) =~ "Edit canvas"
  end

  test "updates chosen resource and redirects when data is valid", %{conn: conn} do
    canvas = Repo.insert! %Canvas{}
    conn = put conn, canvas_path(conn, :update, canvas), canvas: @valid_attrs
    assert redirected_to(conn) == canvas_path(conn, :show, canvas)
    assert Repo.get_by(Canvas, @valid_attrs)
  end

  test "does not update chosen resource and renders errors when data is invalid", %{conn: conn} do
    canvas = Repo.insert! %Canvas{}
    conn = put conn, canvas_path(conn, :update, canvas), canvas: @invalid_attrs
    assert html_response(conn, 200) =~ "Edit canvas"
  end

  test "deletes chosen resource", %{conn: conn} do
    canvas = Repo.insert! %Canvas{}
    conn = delete conn, canvas_path(conn, :delete, canvas)
    assert redirected_to(conn) == canvas_path(conn, :index)
    refute Repo.get(Canvas, canvas.id)
  end
end
