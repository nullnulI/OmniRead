package com.omniread.backend.dto;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GenerateForecastRequest {

    @Min(1)
    @Max(30)
    private Integer horizonDays = 7;

    @Min(1)
    @Max(90)
    private Integer lookbackDays = 14;
}
