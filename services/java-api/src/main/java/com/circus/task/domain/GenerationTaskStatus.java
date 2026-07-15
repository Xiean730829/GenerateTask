package com.circus.task.domain;

public enum GenerationTaskStatus {
    PENDING("pending"),
    QUEUED("queued"),
    RUNNING("running"),
    SUCCEEDED("succeeded"),
    FAILED("failed"),
    RETRYING("retrying"),
    CANCELED("canceled");

    private final String wireValue;

    GenerationTaskStatus(String wireValue) {
        this.wireValue = wireValue;
    }

    public String wireValue() {
        return wireValue;
    }
}
