from workers import WorkerEntrypoint, Response
import json
from datetime import datetime, timezone

class Default(WorkerEntrypoint):
    async def on_fetch(self, request):
        url = str(request.url)

        # Simple routing
        if "/health" in url:
            return Response(json.dumps({
                "status": "healthy",
                "service": "Legal Events Calendar API",
                "version": "1.0.0",
                "total_events": 159
            }), headers={"Content-Type": "application/json"})

        elif "/events" in url:
            events = self.get_events()
            return Response(json.dumps({
                "success": True,
                "data": events,
                "total_events": len(events)
            }), headers={"Content-Type": "application/json"})

        else:
            return Response("Legal Events Calendar API - Use /events or /health endpoints")

    def get_events(self):
        """Get test events"""
        return [
            {
                "id": "test_1",
                "title": "Test Event 1",
                "description": "This is a test event",
                "start": "2025-06-12T18:15:00",
                "end": "2025-06-12T19:30:00",
                "location": "TBD",
                "url": "",
                "category": ["Legal"],
                "tags": [],
                "event_type": "",
                "cle_credits": None,
                "community": "test",
                "status": "approved"
            }
        ]