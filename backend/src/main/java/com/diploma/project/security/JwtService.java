package com.diploma.project.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private static final String SECRET = "my-super-secret-key-that-is-at-least-32-bytes-long";
    private static final long EXPIRATION_MILLIS = 24L * 60 * 60 * 1000;

    private final SecretKey signingKey = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));

    public String generateToken(String email) {
        Instant now = Instant.now();
        Instant exp = now.plusMillis(EXPIRATION_MILLIS);
        return Jwts.builder()
                .subject(email)
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .signWith(signingKey)
                .compact();
    }
}
