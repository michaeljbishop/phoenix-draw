defmodule Draw.CanvasChannel do
  use Phoenix.Channel

  def join("canvas:"  <> _room_id, _message, socket) do
    {:ok, socket}
  end
  
  def handle_in("lineStart", %{"points" => points}, socket) do
    broadcast! socket, "lineStart", %{page_id: socket.assigns.page_id, points: points}
    {:noreply, socket}
  end
  def handle_in("lineTo", %{"points" => points}, socket) do
    broadcast! socket, "lineTo", %{page_id: socket.assigns.page_id, points: points}
    {:noreply, socket}
  end
  def handle_in("lineEnd", %{"identifiers" => identifiers}, socket) do
    broadcast! socket, "lineEnd", %{page_id: socket.assigns.page_id, identifiers: identifiers}
    {:noreply, socket}
  end

  # Pages draw locally to their own canvas before sending out draw events so
  # we don't rebroadcast them the event they sent the server.

  intercept ["lineStart", "lineTo", "lineEnd"]

  def handle_out(msg_name, %{page_id: page_id} = payload, socket) do
    unless page_id === socket.assigns.page_id,
      do: push socket, msg_name, Map.delete(payload, :page_id)
    {:noreply, socket}
  end
end
