package com.finance.dashboard.service;

import com.finance.dashboard.dto.request.FinancialRecordRequest;
import com.finance.dashboard.dto.response.FinancialRecordResponse;
import com.finance.dashboard.exception.BadRequestException;
import com.finance.dashboard.exception.DuplicateRecordException;
import com.finance.dashboard.exception.ResourceNotFoundException;
import com.finance.dashboard.model.FinancialRecord;
import com.finance.dashboard.model.FinancialRecord.RecordType;
import com.finance.dashboard.model.User;
import com.finance.dashboard.repository.FinancialRecordRepository;
import com.finance.dashboard.repository.UserRepository;
import com.finance.dashboard.util.AuditLogger;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FinancialRecordService {

    private final FinancialRecordRepository recordRepository;
    private final UserRepository            userRepository;

    private static final List<String> ALLOWED_SORT_FIELDS = List.of("date", "amount", "category");

    @Transactional
    public FinancialRecordResponse create(FinancialRecordRequest request) {
        User user = findUserOrThrow(request.getUserId());

        if (recordRepository.existsDuplicate(
                user.getId(), request.getAmount(), request.getType(),
                request.getCategory(), request.getDate())) {
            AuditLogger.duplicateDetected(user.getUsername(),
                    request.getType().name(), request.getCategory(), request.getDate());
            throw new DuplicateRecordException(
                    "A record with the same amount, type, category, and date already exists for this user");
        }

        FinancialRecord saved = recordRepository.save(mapToEntity(request, user));
        AuditLogger.recordCreated(user.getUsername(), saved.getId(),
                saved.getType().name(), saved.getAmount(), saved.getCategory());
        return new FinancialRecordResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<FinancialRecordResponse> getAll(int page, int size, String sortBy, String direction) {
        if (!ALLOWED_SORT_FIELDS.contains(sortBy)) {
            throw new BadRequestException(
                "Invalid sort field: '" + sortBy + "'. Allowed: " + ALLOWED_SORT_FIELDS);
        }
        Sort sort = direction.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return recordRepository.findAll(pageable).map(FinancialRecordResponse::new);
    }

    // kept for filter endpoints that still use Pageable directly
    @Transactional(readOnly = true)
    public Page<FinancialRecordResponse> getAll(Pageable pageable) {
        return recordRepository.findAll(pageable).map(FinancialRecordResponse::new);
    }

    @Transactional(readOnly = true)
    public FinancialRecordResponse getById(Long id) {
        return new FinancialRecordResponse(findRecordOrThrow(id));
    }

    @Transactional(readOnly = true)
    public Page<FinancialRecordResponse> filterByType(RecordType type, Pageable pageable) {
        return recordRepository.findByType(type, pageable).map(FinancialRecordResponse::new);
    }

    @Transactional(readOnly = true)
    public Page<FinancialRecordResponse> filterByCategory(String category, Pageable pageable) {
        return recordRepository.findByCategory(category.trim(), pageable).map(FinancialRecordResponse::new);
    }

    @Transactional(readOnly = true)
    public Page<FinancialRecordResponse> filterByDateRange(LocalDate from, LocalDate to, Pageable pageable) {
        if (from.isAfter(to)) {
            throw new BadRequestException("'from' date must not be after 'to' date");
        }
        return recordRepository.findByDateRange(from, to, pageable).map(FinancialRecordResponse::new);
    }

    @Transactional
    public FinancialRecordResponse update(Long id, FinancialRecordRequest request) {
        FinancialRecord record = findRecordOrThrow(id);
        User user = findUserOrThrow(request.getUserId());

        boolean isDuplicate = recordRepository.existsDuplicate(
                user.getId(), request.getAmount(), request.getType(),
                request.getCategory(), request.getDate());
        if (isDuplicate && !record.getUser().getId().equals(user.getId())) {
            throw new DuplicateRecordException(
                    "Another record with the same amount, type, category, and date already exists");
        }

        record.setAmount(request.getAmount());
        record.setType(request.getType());
        record.setCategory(request.getCategory());
        record.setDate(request.getDate());
        record.setDescription(request.getDescription());
        record.setUser(user);

        AuditLogger.recordUpdated(user.getUsername(), id);
        return new FinancialRecordResponse(recordRepository.save(record));
    }

    @Transactional
    public void delete(Long id) {
        FinancialRecord record = findRecordOrThrow(id);
        record.setDeleted(true);
        recordRepository.save(record);
        AuditLogger.recordDeleted(id);
    }

    // ── Private helpers ─────────────────────────────────────────────────────

    private FinancialRecord mapToEntity(FinancialRecordRequest req, User user) {
        FinancialRecord r = new FinancialRecord();
        r.setAmount(req.getAmount());
        r.setType(req.getType());
        r.setCategory(req.getCategory().trim());
        r.setDate(req.getDate());
        r.setDescription(req.getDescription());
        r.setUser(user);
        return r;
    }

    private FinancialRecord findRecordOrThrow(Long id) {
        return recordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Financial record not found with id: " + id));
    }

    private User findUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }
}
