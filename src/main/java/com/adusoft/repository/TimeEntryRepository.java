package com.adusoft.repository;

import com.adusoft.model.TimeEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TimeEntryRepository extends JpaRepository<TimeEntry, Long> {

  List<TimeEntry> findByUsername(String username);

  List<TimeEntry> findByUsernameAndNameLike(String username, String name);

}
