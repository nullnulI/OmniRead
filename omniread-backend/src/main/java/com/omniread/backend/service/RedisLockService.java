package com.omniread.backend.service;

import java.time.Duration;
import java.util.Optional;

public interface RedisLockService {

    Optional<String> tryLock(String key, Duration ttl);

    void unlock(String key, String token);
}
