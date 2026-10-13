"""
Traffic Control Engine
Implements Leaky Bucket and Token Bucket traffic shaping and policing algorithms
as taught in Computer Networks (Unit IV Congestion Control & QoS).
"""

import time
import math


class LeakyBucket:
    """
    Leaky Bucket Algorithm:
    Shapes bursty traffic into a smooth, constant output flow.
    Arriving packets enter a finite buffer (capacity).
    If buffer is full, excess packets overflow and are dropped.
    The bucket leaks (transmits) at a strictly constant rate.
    """

    def __init__(self, capacity_mb=10.0, output_rate_mbps=20.0):
        """
        :param capacity_mb: Maximum buffer storage in Megabits (or MB equivalent).
        :param output_rate_mbps: Constant drain/transmission rate in Mbps.
        """
        self.capacity_mb = max(0.1, float(capacity_mb))
        self.output_rate_mbps = max(0.1, float(output_rate_mbps))
        self.current_fill_mb = 0.0
        
        # Cumulative and step counters
        self.total_arrived_mb = 0.0
        self.total_admitted_mb = 0.0
        self.total_transmitted_mb = 0.0
        self.total_dropped_mb = 0.0
        self.total_queue_delay_ms = 0.0
        self.delay_samples = 0

    def process_step(self, arrival_mb, time_step_sec=1.0):
        """
        Process traffic arriving during a simulation time step.
        :param arrival_mb: Volume of offered traffic in this step (Mb).
        :param time_step_sec: Duration of simulation step in seconds (default 1.0s).
        :return: dict with admitted, transmitted, dropped, current_fill, queue_delay_ms.
        """
        arrival_mb = max(0.0, float(arrival_mb))
        self.total_arrived_mb += arrival_mb

        # Available space before adding new arrival
        free_space = max(0.0, self.capacity_mb - self.current_fill_mb)

        if arrival_mb <= free_space:
            admitted_mb = arrival_mb
            dropped_mb = 0.0
        else:
            admitted_mb = free_space
            dropped_mb = arrival_mb - free_space

        self.current_fill_mb += admitted_mb
        self.total_admitted_mb += admitted_mb
        self.total_dropped_mb += dropped_mb

        # Drain (leak) at constant rate
        max_leakable = self.output_rate_mbps * time_step_sec
        transmitted_mb = min(self.current_fill_mb, max_leakable)
        self.current_fill_mb = max(0.0, self.current_fill_mb - transmitted_mb)
        self.total_transmitted_mb += transmitted_mb

        # Queueing delay for buffered packets: Little's Law / Fill / Service Rate
        if self.output_rate_mbps > 0:
            queue_delay_ms = (self.current_fill_mb / self.output_rate_mbps) * 1000.0
        else:
            queue_delay_ms = 0.0

        if admitted_mb > 0:
            self.total_queue_delay_ms += queue_delay_ms
            self.delay_samples += 1

        return {
            "arrived_mb": round(arrival_mb, 4),
            "admitted_mb": round(admitted_mb, 4),
            "transmitted_mb": round(transmitted_mb, 4),
            "dropped_mb": round(dropped_mb, 4),
            "current_fill_mb": round(self.current_fill_mb, 4),
            "capacity_mb": self.capacity_mb,
            "fill_percentage": round((self.current_fill_mb / self.capacity_mb) * 100.0, 2),
            "queue_delay_ms": round(queue_delay_ms, 2)
        }

    def reset(self):
        """Resets bucket state."""
        self.current_fill_mb = 0.0
        self.total_arrived_mb = 0.0
        self.total_admitted_mb = 0.0
        self.total_transmitted_mb = 0.0
        self.total_dropped_mb = 0.0
        self.total_queue_delay_ms = 0.0
        self.delay_samples = 0

    def get_stats(self):
        """Returns summary statistics."""
        avg_delay = (self.total_queue_delay_ms / self.delay_samples) if self.delay_samples > 0 else 0.0
        return {
            "type": "leaky_bucket",
            "capacity_mb": self.capacity_mb,
            "output_rate_mbps": self.output_rate_mbps,
            "current_fill_mb": round(self.current_fill_mb, 4),
            "fill_percentage": round((self.current_fill_mb / self.capacity_mb) * 100.0, 2),
            "total_arrived_mb": round(self.total_arrived_mb, 4),
            "total_admitted_mb": round(self.total_admitted_mb, 4),
            "total_transmitted_mb": round(self.total_transmitted_mb, 4),
            "total_dropped_mb": round(self.total_dropped_mb, 4),
            "avg_queue_delay_ms": round(avg_delay, 2)
        }


class TokenBucket:
    """
    Token Bucket Algorithm:
    Tokens are generated at a constant rate r and accumulated up to bucket capacity B.
    Incoming traffic consumes tokens.
    Supports traffic bursts when tokens have accumulated up to capacity B.
    Modes:
      - 'shaping': packets without tokens wait in buffer. Excess dropped if buffer full.
      - 'policing': packets exceeding tokens are immediately dropped.
    """

    def __init__(self, token_rate_mbps=25.0, bucket_capacity_tokens=30.0, initial_tokens=15.0, mode="shaping", buffer_capacity_mb=10.0):
        """
        :param token_rate_mbps: Token arrival rate in tokens (Mb) per second.
        :param bucket_capacity_tokens: Maximum token capacity (Burst size in Mb).
        :param initial_tokens: Initial tokens in bucket.
        :param mode: 'shaping' (buffer and delay) or 'policing' (drop excess immediately).
        :param buffer_capacity_mb: Buffer size for waiting packets in shaping mode.
        """
        self.token_rate_mbps = max(0.1, float(token_rate_mbps))
        self.bucket_capacity_tokens = max(0.1, float(bucket_capacity_tokens))
        self.tokens = min(self.bucket_capacity_tokens, max(0.0, float(initial_tokens)))
        self.mode = mode if mode in ("shaping", "policing") else "shaping"
        self.buffer_capacity_mb = max(0.1, float(buffer_capacity_mb))
        self.buffered_traffic_mb = 0.0

        # Stats
        self.total_arrived_mb = 0.0
        self.total_admitted_mb = 0.0
        self.total_transmitted_mb = 0.0
        self.total_dropped_mb = 0.0
        self.burst_events = 0

    def process_step(self, arrival_mb, time_step_sec=1.0):
        """
        Simulate token generation and traffic admission for a time step.
        """
        arrival_mb = max(0.0, float(arrival_mb))
        self.total_arrived_mb += arrival_mb

        # 1. Replenish tokens
        new_tokens = self.token_rate_mbps * time_step_sec
        self.tokens = min(self.bucket_capacity_tokens, self.tokens + new_tokens)

        admitted_mb = 0.0
        transmitted_mb = 0.0
        dropped_mb = 0.0

        if self.mode == "policing":
            # Policing mode: instantaneous check against tokens
            if arrival_mb <= self.tokens:
                admitted_mb = arrival_mb
                transmitted_mb = arrival_mb
                self.tokens -= arrival_mb
                dropped_mb = 0.0
            else:
                admitted_mb = self.tokens
                transmitted_mb = self.tokens
                dropped_mb = arrival_mb - self.tokens
                self.tokens = 0.0

            if transmitted_mb > self.token_rate_mbps * time_step_sec:
                self.burst_events += 1

            queue_delay_ms = 0.0

        else:
            # Shaping mode: buffered packets + new arrivals
            total_offered = self.buffered_traffic_mb + arrival_mb
            
            # Can transmit up to current tokens
            transmittable = min(total_offered, self.tokens)
            transmitted_mb = transmittable
            self.tokens -= transmittable

            remaining_to_buffer = total_offered - transmittable
            if remaining_to_buffer <= self.buffer_capacity_mb:
                self.buffered_traffic_mb = remaining_to_buffer
                dropped_mb = 0.0
            else:
                # Buffer overflow
                self.buffered_traffic_mb = self.buffer_capacity_mb
                dropped_mb = remaining_to_buffer - self.buffer_capacity_mb

            admitted_mb = arrival_mb - dropped_mb

            if transmitted_mb > self.token_rate_mbps * time_step_sec:
                self.burst_events += 1

            queue_delay_ms = (self.buffered_traffic_mb / self.token_rate_mbps * 1000.0) if self.token_rate_mbps > 0 else 0.0

        self.total_admitted_mb += admitted_mb
        self.total_transmitted_mb += transmitted_mb
        self.total_dropped_mb += dropped_mb

        return {
            "arrived_mb": round(arrival_mb, 4),
            "admitted_mb": round(admitted_mb, 4),
            "transmitted_mb": round(transmitted_mb, 4),
            "dropped_mb": round(dropped_mb, 4),
            "tokens_remaining": round(self.tokens, 4),
            "tokens_capacity": self.bucket_capacity_tokens,
            "buffered_mb": round(self.buffered_traffic_mb, 4),
            "queue_delay_ms": round(queue_delay_ms, 2),
            "burst_delivered": transmitted_mb > (self.token_rate_mbps * time_step_sec)
        }

    def reset(self):
        """Resets token bucket state."""
        self.tokens = self.bucket_capacity_tokens
        self.buffered_traffic_mb = 0.0
        self.total_arrived_mb = 0.0
        self.total_admitted_mb = 0.0
        self.total_transmitted_mb = 0.0
        self.total_dropped_mb = 0.0
        self.burst_events = 0

    def get_stats(self):
        """Returns token bucket stats."""
        return {
            "type": "token_bucket",
            "token_rate_mbps": self.token_rate_mbps,
            "bucket_capacity_tokens": self.bucket_capacity_tokens,
            "current_tokens": round(self.tokens, 4),
            "mode": self.mode,
            "buffered_traffic_mb": round(self.buffered_traffic_mb, 4),
            "total_arrived_mb": round(self.total_arrived_mb, 4),
            "total_admitted_mb": round(self.total_admitted_mb, 4),
            "total_transmitted_mb": round(self.total_transmitted_mb, 4),
            "total_dropped_mb": round(self.total_dropped_mb, 4),
            "burst_events": self.burst_events
        }
