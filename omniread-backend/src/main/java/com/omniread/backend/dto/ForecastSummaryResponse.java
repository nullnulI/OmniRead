package com.omniread.backend.dto;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ForecastSummaryResponse {

    private Integer generatedCount;
    private List<ForecastResponse> forecasts;
}
