import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { BleDevice } from '../types/bluetooth';
import { CarState, ControlType } from '../types/car';
import FeedbackButton from './FeedbackButton';

interface CarControlsProps {
	connectedDeviceId: string | null;
	devices: BleDevice[];
	carState: CarState;
	onCommandSent: (message: string, success: boolean) => void;
	onStateUpdate: (newState: Partial<CarState>) => void;
}

const CarControls: React.FC<CarControlsProps> = ({
	connectedDeviceId,
	devices,
	carState,
	onCommandSent,
	onStateUpdate
}) => {
	const [isSending, setIsSending] = useState<Record<ControlType | 'bsm', boolean>>({
		relay: false,
		trunk: false,
		steering: false,
		seat_driver_heat: false,
		seat_driver_vent: false,
		seat_passenger_heat: false,
		seat_passenger_vent: false,
		bsm: false,
		security: false,
	});

	const fadeAnim = useRef(new Animated.Value(0)).current;
	const scaleAnim = useRef(new Animated.Value(0.95)).current;

	const timersRef = useRef<Record<ControlType | 'bsm', ReturnType<typeof setTimeout> | null>>({
		relay: null, trunk: null, steering: null, seat_driver_heat: null,
		seat_driver_vent: null, seat_passenger_heat: null, seat_passenger_vent: null, bsm: null,
			security: null,
	});

	useEffect(() => {
		if (connectedDeviceId) {
			Animated.parallel([
				Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
				Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 10, useNativeDriver: true }),
			]).start();
		} else {
			Animated.parallel([
				Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
				Animated.timing(scaleAnim, { toValue: 0.95, duration: 200, useNativeDriver: true }),
			]).start();
		}
		return () => {
			Object.values(timersRef.current).forEach(timer => timer && clearTimeout(timer));
		};
	}, [connectedDeviceId]);

	const toggleFeature = async (type: ControlType) => {
		if (!connectedDeviceId || isSending[type]) {
			console.log(`⛔ Игнорирование повторного нажатия ${type}`);
			return;
		}

		const climateAndBsmTypes: (ControlType | 'bsm')[] = ['steering', 'seat_driver_heat', 'seat_driver_vent', 'seat_passenger_heat', 'seat_passenger_vent', 'bsm'];
		if (!carState.relay && climateAndBsmTypes.includes(type)) {
			onCommandSent('⚠️ Двигатель выключен. Запустите двигатель для использования климата и BSM.', false);
			return;
		}

		if (timersRef.current[type]) {
			clearTimeout(timersRef.current[type]!);
			timersRef.current[type] = null;
		}

		setIsSending(prev => ({ ...prev, [type]: true }));

		timersRef.current[type] = setTimeout(() => {
			console.warn(`⚠️ Таймаут операции ${type}. Принудительная разблокировка.`);
			timersRef.current[type] = null;
			setIsSending(prev => ({ ...prev, [type]: false }));
		}, 3000);

		try {
			const isCurrentlyOn = getIsOn(type, carState);
			const targetState = !isCurrentlyOn;

			await new Promise(res => setTimeout(res, 200));

			const newState: Partial<CarState> = {};
			let message = '';

			if (targetState) {
				switch (type) {
					case 'relay': newState.relay = true; message = '✅ Двигатель ЗАПУЩЕН'; break;
					case 'trunk': newState.trunk = true; message = '📦 Багажник ОТКРЫТ'; break;
					case 'bsm': newState.bsm = true; message = '🚗 BSM ВКЛ'; break;
					case 'security': newState.security = true; message = '🔒 Охрана ВКЛ'; break;
					case 'steering': newState.steering = true; message = '🔥 Подогрев руля ВКЛ'; break;
					case 'seat_driver_heat': newState.seat_driver_heat = true; newState.seat_driver_vent = false; message = '🔥 Подогрев водителя ВКЛ'; break;
					case 'seat_driver_vent': newState.seat_driver_vent = true; newState.seat_driver_heat = false; message = '❄️ Вентиляция водителя ВКЛ'; break;
					case 'seat_passenger_heat': newState.seat_passenger_heat = true; newState.seat_passenger_vent = false; message = '🔥 Подогрев пассажира ВКЛ'; break;
					case 'seat_passenger_vent': newState.seat_passenger_vent = true; newState.seat_passenger_heat = false; message = '❄️ Вентиляция пассажира ВКЛ'; break;
				}
			} else {
				switch (type) {
					case 'relay': newState.relay = false; message = '✅ Двигатель ОСТАНОВЛЕН'; break;
					case 'trunk': newState.trunk = false; message = '🔒 Багажник ЗАКРЫТ'; break;
					case 'bsm': newState.bsm = false; message = '🚗 BSM ВЫКЛ'; break;
					case 'security': newState.security = false; message = '🔓 Охрана ВЫКЛ'; break;
					case 'steering': newState.steering = false; message = '🔥 Подогрев руля ВЫКЛ'; break;
					case 'seat_driver_heat': newState.seat_driver_heat = false; message = '❄️ Подогрев водителя ВЫКЛ'; break;
					case 'seat_driver_vent': newState.seat_driver_vent = false; message = '❄️ Вентиляция водителя ВЫКЛ'; break;
					case 'seat_passenger_heat': newState.seat_passenger_heat = false; message = '❄️ Подогрев пассажира ВЫКЛ'; break;
					case 'seat_passenger_vent': newState.seat_passenger_vent = false; message = '❄️ Вентиляция пассажира ВЫКЛ'; break;
				}
			}

			onStateUpdate(newState);
			onCommandSent(message, true);

		} catch (error) {
			console.error('Ошибка отправки:', error);
			onCommandSent('❌ Нет ответа от ESP32', false);
		} finally {
			if (timersRef.current[type]) {
				clearTimeout(timersRef.current[type]!);
				timersRef.current[type] = null;
			}
			setIsSending(prev => {
				if (prev[type]) {
					return { ...prev, [type]: false };
				}
				return prev;
			});
		}
	};

	const getIsOn = (type: ControlType | 'bsm', state: CarState): boolean => {
		switch (type) {
			case 'relay': return state.relay;
			case 'trunk': return state.trunk;
			case 'bsm': return state.bsm;
		case 'security': return state.security;
			case 'steering': return state.steering;
			case 'seat_driver_heat': return state.seat_driver_heat;
			case 'seat_driver_vent': return state.seat_driver_vent;
			case 'seat_passenger_heat': return state.seat_passenger_heat;
			case 'seat_passenger_vent': return state.seat_passenger_vent;
			default: return false;
		}
	};

	const isClimateLocked = !carState.relay;

	if (!connectedDeviceId) return null;

	return (
		<Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
			<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

				{/* ── ДВИГАТЕЛЬ ── */}
				<View style={styles.section}>
					<Text style={styles.sectionEyebrow}>СИЛОВАЯ УСТАНОВКА</Text>
					<View style={styles.orbSection}>
						<FeedbackButton onPress={() => toggleFeature('relay')} activeOpacity={0.85}>
							<Animated.View style={[
								styles.orbOuter,
								carState.relay && { borderColor: colors.engine + '88' }
							]}>
								<View style={[styles.orbInner, { backgroundColor: carState.relay ? colors.engine : colors.backgroundElevated }]}>
									{isSending.relay ? (
										<Text style={styles.orbIcon}>⏳</Text>
									) : (
										<Ionicons name='power' size={28} color={carState.relay ? '#fff' : colors.textMuted} />
									)}
								</View>
							</Animated.View>
						</FeedbackButton>
						<Text style={[styles.orbLabel, carState.relay && { color: colors.success }]}>
							{carState.relay ? '● РАБОТАЕТ' : '○ ОСТАНОВЛЕН'}
						</Text>
					</View>
				</View>

				{/* ── УПРАВЛЕНИЕ ── */}
				<View style={styles.section}>
					<View style={styles.sectionHeaderRow}>
						<Text style={styles.sectionEyebrow}>УПРАВЛЕНИЕ</Text>
						{isClimateLocked && <Ionicons name='lock-closed' size={14} color={colors.textMuted} />}
					</View>

					{isClimateLocked && (
						<Text style={styles.lockMessage}>Запустите двигатель для доступа</Text>
					)}

					<View style={styles.chipsGrid}>
						{/* Багажник */}
						<ChipBtn
							label='Багажник'
							icon={carState.trunk ? '🔒' : '📦'}
							isActive={carState.trunk}
							colorActive={colors.trunk}
							colorInactive={colors.trunkOff}
							loading={isSending.trunk}
							onPress={() => toggleFeature('trunk')}
							
						/>

						{/* Охрана */}
						<ChipBtn
							label='Охрана'
							icon='🔒'
							isActive={carState.security}
							colorActive={colors.security}
							colorInactive={colors.securityOff}
							loading={isSending.security}
							onPress={() => toggleFeature('security')}
						/>

						<View style={styles.seatGroup}>
							<Text style={styles.seatLabel}>РУЛЬ / BSM</Text>
							<View style={styles.seatRow}>
								<ChipBtn
									label='Руль'
									icon=''
									isActive={carState.steering && !isClimateLocked}
									colorActive={colors.steering}
									colorInactive={colors.steeringOff}
									loading={isSending.steering}
									onPress={() => toggleFeature('steering')}
									locked={isClimateLocked}
									iconComponent={
										<MaterialCommunityIcons
											name='steering'
											size={28}
											color={carState.steering && !isClimateLocked ? colors.steering : colors.textSecondary}
										/>
									}
									flex
								/>
								<ChipBtn
									label='BSM'
									icon=''
									isActive={carState.bsm}
									colorActive={colors.bsm}
									colorInactive={colors.bsmOff}
									loading={isSending.bsm}
									onPress={() => toggleFeature('bsm')}
									locked={isClimateLocked}
									iconComponent={
										<MaterialCommunityIcons
											name='car-side'
											size={28}
											color={carState.bsm ? colors.bsm : colors.textSecondary}
										/>
									}
									flex
								/>
							</View>
						</View>
					</View>
								{/* Водитель */}
						<View style={styles.seatGroup}>
							<Text style={styles.seatLabel}>ВОДИТЕЛЬ</Text>
							<View style={styles.seatRow}>
								<ChipBtn
									label='Подогрев'
									icon='🔥'
									isActive={carState.seat_driver_heat && !isClimateLocked}
									colorActive={colors.seatHeat}
									colorInactive={colors.seatHeatOff}
									loading={isSending.seat_driver_heat}
									onPress={() => toggleFeature('seat_driver_heat')}
									locked={isClimateLocked}
									flex
								/>
								<ChipBtn
									label='Вентиляция'
									icon='❄️'
									isActive={carState.seat_driver_vent && !isClimateLocked}
									colorActive={colors.seatVent}
									colorInactive={colors.seatHeatOff}
									loading={isSending.seat_driver_vent}
									onPress={() => toggleFeature('seat_driver_vent')}
									locked={isClimateLocked}
									flex
								/>
							</View>
						</View>

						{/* Пассажир */}
						<View style={styles.seatGroup}>
							<Text style={styles.seatLabel}>ПАССАЖИР</Text>
							<View style={styles.seatRow}>
								<ChipBtn
									label='Подогрев'
									icon='🔥'
									isActive={carState.seat_passenger_heat && !isClimateLocked}
									colorActive={colors.seatHeat}
									colorInactive={colors.seatHeatOff}
									loading={isSending.seat_passenger_heat}
									onPress={() => toggleFeature('seat_passenger_heat')}
									locked={isClimateLocked}
									flex
								/>
								<ChipBtn
									label='Вентиляция'
									icon='❄️'
									isActive={carState.seat_passenger_vent && !isClimateLocked}
									colorActive={colors.seatVent}
									colorInactive={colors.seatHeatOff}
									loading={isSending.seat_passenger_vent}
									onPress={() => toggleFeature('seat_passenger_vent')}
									locked={isClimateLocked}
									flex
								/>
							</View>
						</View>
				</View>
			</ScrollView>
		</Animated.View>
	);
};

// ── Chip-кнопка (стиль AmbientLight: пилюля с бордером) ──
interface ChipBtnProps {
	label: string;
	icon: string;
	isActive: boolean;
	colorActive: string;
	colorInactive: string;
	loading?: boolean;
	onPress: () => void;
	locked?: boolean;
	flex?: boolean;
	iconComponent?: React.ReactNode;
	circle?: boolean;
}

const ChipBtn: React.FC<ChipBtnProps> = ({ label, icon, isActive, colorActive, colorInactive, loading, onPress, locked, flex, iconComponent, circle }) => {
	const disabled = locked || loading;

	if (circle) {
		return (
			<View style={styles.circleWrap}>
				<FeedbackButton
					onPress={onPress}
					disabled={disabled}
					activeOpacity={0.7}
					style={[styles.circleBtn, { opacity: disabled ? 0.5 : 1 }]}
				>
					<View style={styles.circleContent}>
						{iconComponent ? (
							<View style={styles.circleIconWrap}>{iconComponent}</View>
						) : null}
						<Text style={[
							styles.circleLabel,
							{ color: disabled ? colors.textMuted : (isActive ? colorActive : colors.textSecondary) }
						]}>{loading ? '⏳' : label}</Text>
					</View>
				</FeedbackButton>
			</View>
		);
	}

	return (
		<FeedbackButton
			onPress={onPress}
			disabled={disabled}
			activeOpacity={0.7}
			style={[
				styles.chip,
				flex && styles.chipFlex,
				{
					backgroundColor: disabled ? colors.backgroundElevated : (isActive ? colorActive + '22' : colorInactive),
					borderColor: disabled ? colors.border : (isActive ? colorActive : 'rgba(255,255,255,0.2)'),
					opacity: disabled ? 0.5 : 1,
				}
			]}
		>
			{loading ? (
				<Text style={styles.chipIcon}>⏳</Text>
			) : iconComponent ? (
				iconComponent
			) : (
				<Text style={styles.chipIcon}>{icon}</Text>
			)}
			<Text style={[
				styles.chipLabel,
				{ color: disabled ? colors.textMuted : (isActive ? colorActive : colors.textSecondary) }
			]}>{label}</Text>
		</FeedbackButton>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollContent: {
		padding: 16,
		paddingTop: 8,
		gap: 16,
	},

	// ── Секции ──
	section: {
		backgroundColor: colors.backgroundCard,
		borderRadius: 20,
		padding: 20,
		borderWidth: 1,
		borderColor: colors.border,
	},
	sectionEyebrow: {
		fontSize: 11,
		fontWeight: '700',
		color: colors.textMuted,
		letterSpacing: 3,
		marginBottom: 16,
	},
	sectionHeaderRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 16,
	},
	lockMessage: {
		fontSize: 12,
		color: colors.textMuted,
		fontStyle: 'italic',
		marginBottom: 12,
		textAlign: 'center',
	},

	// ── Орб двигателя ──
	orbSection: {
		alignItems: 'center',
		paddingVertical: 8,
	},
	orbOuter: {
		width: 80,
		height: 80,
		borderRadius: 40,
		borderWidth: 2,
		borderColor: colors.border,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.backgroundElevated,
	},
	orbInner: {
		width: 64,
		height: 64,
		borderRadius: 32,
		alignItems: 'center',
		justifyContent: 'center',
	},
	orbIcon: {
		fontSize: 24,
	},
	orbLabel: {
		marginTop: 14,
		fontSize: 12,
		fontWeight: '700',
		letterSpacing: 2,
		color: colors.textMuted,
	},

	// ── Chip-кнопки ──
	chipsGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 10,
	},
	chip: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingVertical: 14,
		paddingHorizontal: 18,
		borderRadius: 14,
		borderWidth: 1,
	},
	chipIcon: {
		fontSize: 18,
	},
	chipLabel: {
		fontSize: 13,
		fontWeight: '600',
	},

	steerRow: {
		flexDirection: 'row' as const,
		alignItems: 'center' as const,
		gap: 12,
		width: '100%' as const,
		justifyContent: 'center' as const,
	},
	steerOutline: {
		width: 110,
		height: 110,
		alignItems: 'center' as const,
		justifyContent: 'center' as const,
	},
	steerRing: {
		top: 0,
		left: 0,
		position: 'absolute' as const,
		width: 106,
		height: 106,
		borderRadius: 53,
		borderWidth: 6,
	},
	steerSpokeH: {
		position: 'absolute' as const,
		width: 70,
		height: 4,
		borderRadius: 2,
		top: 53,
		left: 20,
	},
	steerSpokeV: {
		position: 'absolute' as const,
		width: 4,
		height: 70,
		borderRadius: 2,
		top: 20,
		left: 53,
	},
	seatGroup: {
		width: '100%' as const,
	},
	seatLabel: {
		fontSize: 11,
		fontWeight: '700' as const,
		color: colors.textMuted,
		letterSpacing: 2,
		marginBottom: 8,
	},
	seatRow: {
		flexDirection: 'row' as const,
		gap: 8,
	},
	chipFlex: {
		flex: 1,
	},
	// ── Preview bar ──
	circleWrap: {
		alignItems: 'center' as const,
		width: 76,
	},
	circleBtn: {
		width: 110,
		height: 110,
		borderRadius: 55,
		backgroundColor: colors.backgroundElevated,
		alignItems: 'center' as const,
		justifyContent: 'center' as const,
		
	},
	circleContent: {
		width: '100%' as const,
		height: '100%' as const,
		alignItems: 'center' as const,
		justifyContent: 'center' as const,
		gap: 4,
	},
	circleIconWrap: {
		alignItems: 'center' as const,
		justifyContent: 'center' as const,
	},
	circleLabelWrap: {
		position: 'absolute' as const,
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		alignItems: 'center' as const,
		justifyContent: 'center' as const,
	},
	circleLabel: {
		fontSize: 11,
		fontWeight: '600' as const,
		color: colors.textMuted,
		marginTop: 6,
		textAlign: 'center' as const,
	},

	previewBar: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		marginTop: 16,
	},
	previewLine: {
		flex: 1,
		height: 1,
		backgroundColor: colors.border,
	},
	previewText: {
		fontSize: 11,
		fontWeight: '600',
		color: colors.textSecondary,
		letterSpacing: 0.5,
		textAlign: 'center',
		flexShrink: 1,
	},
});

export default CarControls;
