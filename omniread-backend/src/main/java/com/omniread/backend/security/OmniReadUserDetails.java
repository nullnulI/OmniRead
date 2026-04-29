package com.omniread.backend.security;

import com.omniread.backend.entity.User;
import com.omniread.backend.entity.enums.AccountStatus;
import java.util.Collection;
import java.util.Collections;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

@Getter
public class OmniReadUserDetails implements UserDetails {

    private final Long id;
    private final String fullName;
    private final String email;
    private final String password;
    private final AccountStatus status;
    private final Collection<? extends GrantedAuthority> authorities;

    public OmniReadUserDetails(User user) {
        this.id = user.getId();
        this.fullName = user.getFullName();
        this.email = user.getEmail();
        this.password = user.getPasswordHash();
        this.status = user.getStatus();
        this.authorities = Collections.singletonList(
            new SimpleGrantedAuthority("ROLE_" + user.getRole().name())
        );
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return status != AccountStatus.DISABLED;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return status == AccountStatus.ACTIVE;
    }
}
