import asyncio
import logging
from typing import Any, Dict, Optional
import httpx
from src.config import settings

logger = logging.getLogger(__name__)


class DaprClient:
    """
    Async HTTP client for interacting with Dapr sidecar.

    Provides methods for:
    - Publishing events to pub/sub topics
    - State management (get/save)
    - Secret retrieval

    All methods include retry logic with exponential backoff.
    """

    def __init__(self):
        self.base_url = f"http://localhost:{settings.dapr_http_port}"
        self.max_retries = 3
        self.base_delay = 0.5  # seconds

    async def _retry_with_backoff(self, func, *args, **kwargs):
        """
        Execute a function with exponential backoff retry logic.

        Args:
            func: Async function to execute
            *args: Positional arguments for the function
            **kwargs: Keyword arguments for the function

        Returns:
            Result from the function

        Raises:
            Exception: If all retry attempts fail
        """
        last_exception = None

        for attempt in range(self.max_retries):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                last_exception = e
                if attempt < self.max_retries - 1:
                    delay = self.base_delay * (2 ** attempt)
                    logger.warning(
                        f"Attempt {attempt + 1}/{self.max_retries} failed: {str(e)}. "
                        f"Retrying in {delay}s..."
                    )
                    await asyncio.sleep(delay)
                else:
                    logger.error(
                        f"All {self.max_retries} attempts failed. Last error: {str(e)}"
                    )

        raise last_exception

    async def publish_event(
        self,
        pubsubname: str,
        topic: str,
        data: Dict[str, Any]
    ) -> None:
        """
        Publish an event to a Dapr pub/sub topic.

        Args:
            pubsubname: Name of the Dapr pub/sub component
            topic: Topic name to publish to
            data: Event data (will be JSON serialized)

        Raises:
            httpx.HTTPError: If the request fails after all retries
        """
        async def _publish():
            url = f"{self.base_url}/v1.0/publish/{pubsubname}/{topic}"
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, json=data)
                response.raise_for_status()
                logger.info(f"Published event to topic '{topic}': {data.get('event_id', 'unknown')}")

        await self._retry_with_backoff(_publish)

    async def get_state(self, store: str, key: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve state from a Dapr state store.

        Args:
            store: Name of the Dapr state store component
            key: State key to retrieve

        Returns:
            State value as dict, or None if key doesn't exist

        Raises:
            httpx.HTTPError: If the request fails after all retries
        """
        async def _get():
            url = f"{self.base_url}/v1.0/state/{store}/{key}"
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url)
                if response.status_code == 204:  # No content - key doesn't exist
                    return None
                response.raise_for_status()
                return response.json()

        result = await self._retry_with_backoff(_get)
        logger.debug(f"Retrieved state from store '{store}', key '{key}'")
        return result

    async def save_state(
        self,
        store: str,
        key: str,
        value: Dict[str, Any]
    ) -> None:
        """
        Save state to a Dapr state store.

        Args:
            store: Name of the Dapr state store component
            key: State key to save
            value: State value (will be JSON serialized)

        Raises:
            httpx.HTTPError: If the request fails after all retries
        """
        async def _save():
            url = f"{self.base_url}/v1.0/state/{store}"
            payload = [
                {
                    "key": key,
                    "value": value
                }
            ]
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                logger.info(f"Saved state to store '{store}', key '{key}'")

        await self._retry_with_backoff(_save)

    async def get_secret(self, store: str, key: str) -> Optional[Dict[str, str]]:
        """
        Retrieve a secret from a Dapr secret store.

        Args:
            store: Name of the Dapr secret store component
            key: Secret key to retrieve

        Returns:
            Secret value as dict, or None if key doesn't exist

        Raises:
            httpx.HTTPError: If the request fails after all retries
        """
        async def _get():
            url = f"{self.base_url}/v1.0/secrets/{store}/{key}"
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url)
                if response.status_code == 204:  # No content - key doesn't exist
                    return None
                response.raise_for_status()
                return response.json()

        result = await self._retry_with_backoff(_get)
        logger.debug(f"Retrieved secret from store '{store}', key '{key}'")
        return result


# Singleton instance
dapr_client = DaprClient()
