"""
BMS Energy & Economic Efficiency Service
Модуль расчета энергоэффективности и окупаемости кондитерского цеха.
Расчет потребляемой активной мощности оборудования (кВт) по законам подобия
и интегральная экономия электроэнергии в тенге (Алматы) и рублях.
"""

class EnergyAuditor:
    def __init__(self):
        # Коммерческие тарифы г. Алматы (ТОО «АлматыЭнергоСбыт», юр. лица)
        self.tariff_day_kzt = 38.50    # Дневной тариф (07:00..23:00)
        self.tariff_night_kzt = 14.20  # Ночной льготный тариф (23:00..07:00)
        self.kzt_to_rub = 0.205        # Индикативный курс пересчета в рубли

        # Базовая паспортная мощность оборудования цеха без BMS (Baseline, кВт):
        # Чиллер AC-201 (14.0) + Вытяжка печей EF-101 (5.5) + Приточный VAV AHU-1 (4.0) + Осушитель DH-301 (3.2) + Свет (1.05)
        self.baseline_power_kw = 27.75

        # Интегральные накопители электроэнергии (кВт·ч) и экономии за время работы
        self.total_actual_kwh = 0.0     # Фактическое потребление с автоматикой (кВт·ч)
        self.total_baseline_kwh = 0.0   # Базовое потребление без автоматики (кВт·ч)
        self.total_saved_kwh = 0.0      # Сбереженная энергия (кВт·ч)
        self.total_saved_kzt = 0.0

    def calculate(
        self,
        z1_fan: int,
        z2_ac: int,
        z3_dehum: int,
        light_z1: int,
        light_z2: int,
        light_z3: int,
        night_mode: bool,
        bms_active: bool = True,
        dt_sec: float = 1.0
    ) -> dict:
        # 1. Чиллер AC-201 (Контур холодоснабжения шоколадного туннеля, 14.0 кВт)
        p_chiller = 1.8 + (z2_ac / 100.0) * 12.2

        # 2. Вытяжной вентилятор горячего цеха (ШУВ-1 / EF-101, 5.5 кВт)
        fan_ratio = max(0.25, z1_fan / 100.0)
        p_fan = 5.5 * (fan_ratio ** 3)

        # 3. Приточная система VAV (AHU-1, 4.0 кВт)
        avg_demand = (z1_fan + z2_ac + z3_dehum) / 300.0
        vav_ratio = max(0.28, avg_demand)
        p_vav = 4.0 * (vav_ratio ** 2.4)

        # 4. Промышленный осушитель DH-301 (Склад муки, 3.2 кВт)
        p_dehum = 0.2 + (z3_dehum / 100.0) * 3.0

        # 5. Освещение цеха High-Bay LED (ЩО-1, 7 светильников = 1.05 кВт)
        avg_light = (light_z1 + light_z2 + light_z3) / 300.0
        p_light = 1.05 * avg_light

        # Текущая фактическая мощность (кВт)
        p_actual = round(p_chiller + p_fan + p_vav + p_dehum + p_light, 2)
        p_base = self.baseline_power_kw
        current_tariff = self.tariff_night_kzt if night_mode else self.tariff_day_kzt

        # Если BMS отключена (ручной режим) - оборудование работает на паспортной мощности
        p_effective = p_actual if bms_active else p_base
        delta_kw = max(0.0, p_base - p_actual) if bms_active else 0.0
        pct_saved = round((delta_kw / p_base) * 100.0, 1) if (bms_active and p_base > 0) else 0.0

        # Интегрирование потребления электроэнергии (кВт·ч = кВт * ч)
        kwh_actual_step = p_effective * (dt_sec / 3600.0)
        kwh_base_step = p_base * (dt_sec / 3600.0)
        self.total_actual_kwh += kwh_actual_step
        self.total_baseline_kwh += kwh_base_step

        kwh_saved_step = delta_kw * (dt_sec / 3600.0)
        self.total_saved_kwh += kwh_saved_step
        self.total_saved_kzt += kwh_saved_step * current_tariff

        pct_energy_saved = round(((self.total_baseline_kwh - self.total_actual_kwh) / self.total_baseline_kwh) * 100.0, 1) if self.total_baseline_kwh > 0 else 0.0

        return {
            "bms_active": bms_active,
            "power_actual_kw": p_actual,
            "power_baseline_kw": p_base,
            "power_saved_kw": round(delta_kw, 2),
            "power_saved_pct": pct_saved,
            "energy_actual_kwh": round(self.total_actual_kwh, 2),
            "energy_baseline_kwh": round(self.total_baseline_kwh, 2),
            "energy_saved_kwh": round(self.total_saved_kwh, 2),
            "energy_saved_pct": pct_energy_saved,
            "money_saved_kzt": int(round(self.total_saved_kzt)),
            "money_saved_rub": int(round(self.total_saved_kzt * self.kzt_to_rub)),
            "tariff_kzt": current_tariff,
            "is_night": night_mode,
            "breakdown": {
                "chiller_kw": round(p_chiller, 2),
                "fan_kw": round(p_fan, 2),
                "vav_kw": round(p_vav, 2),
                "dehum_kw": round(p_dehum, 2),
                "lighting_kw": round(p_light, 2)
            }
        }
