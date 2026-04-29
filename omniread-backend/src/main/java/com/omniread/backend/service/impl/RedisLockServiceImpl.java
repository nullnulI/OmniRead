package com.omniread.backend.service.impl;

import com.omniread.backend.service.RedisLockService;
import java.time.Duration;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RedisLockServiceImpl implements RedisLockService {

    private static final Long UNLOCKED = 1L;

    private final StringRedisTemplate stringRedisTemplate;

    @Override
    public Optional<String> tryLock(String key, Duration ttl) {
        String token = UUID.randomUUID().toString();
        Boolean acquired = stringRedisTemplate.opsForValue().setIfAbsent(key, token, ttl);
        return Boolean.TRUE.equals(acquired) ? Optional.of(token) : Optional.empty();
    }

    @Override
    public void unlock(String key, String token) {
        DefaultRedisScript<Long> unlockScript = new DefaultRedisScript<>();
        unlockScript.setResultType(Long.class);
        unlockScript.setScriptText(
            "if redis.call('get', KEYS[1]) == ARGV[1] then "
                + "return redis.call('del', KEYS[1]) "
                + "else return 0 end"
        );
        Long result = stringRedisTemplate.execute(unlockScript, Collections.singletonList(key), token);
        if (!UNLOCKED.equals(result)) {
            return;
        }
    }
}
