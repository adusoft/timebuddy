package com.adusoft.model;

import javax.persistence.*;
import javax.validation.constraints.Pattern;

@Entity
public class TimeEntry {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String username;

  @Column(nullable = false)
  private String name;

  @Column(nullable = false)
  private String city;

  @Pattern(regexp = "^([+-](?:2[0-3]|[01][0-9]):[0-5][0-9])$", message = "timezone must have format +HH:MM or -HH:MM")
  @Column(nullable = false)
  private String timezone;

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getUsername() {
    return username;
  }

  public void setUsername(String username) {
    this.username = username;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getCity() {
    return city;
  }

  public void setCity(String city) {
    this.city = city;
  }

  public String getTimezone() {
    return timezone;
  }

  public void setTimezone(String timezone) {
    this.timezone = timezone;
  }

}
