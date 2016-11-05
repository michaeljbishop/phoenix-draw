defmodule Draw.CanvasChannel do
  use Phoenix.Channel

  def join("canvas:"  <> _room_id, _message, socket) do
    {:ok, socket}
  end
  
  def handle_in("strokeStart", %{"points" => points}, socket) do
    broadcast! socket, "strokeStart", %{page_id: socket.assigns.page_id, points: points}
    {:noreply, socket}
  end
  def handle_in("strokeTo", %{"points" => points}, socket) do
    broadcast! socket, "strokeTo", %{page_id: socket.assigns.page_id, points: points}
    {:noreply, socket}
  end
  def handle_in("strokeEnd", %{"identifiers" => identifiers}, socket) do
    broadcast! socket, "strokeEnd", %{page_id: socket.assigns.page_id, identifiers: identifiers}
    {:noreply, socket}
  end

  # Pages draw locally to their own canvas before sending out draw events so
  # we don't rebroadcast them the event they sent the server.

  intercept ["strokeStart", "strokeTo", "strokeEnd"]

  def handle_out(msg_name, %{page_id: page_id} = payload, socket) do
    unless page_id === socket.assigns.page_id,
      do: push socket, msg_name, Map.delete(payload, :page_id)
    {:noreply, socket}
  end
end
