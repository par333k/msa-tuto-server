/**
 * 이벤트 데이터 제공자 인터페이스
 * 이벤트 조건 검증에 필요한 데이터를 제공하는 인터페이스입니다.
 */
export interface EventDataProvider {
  /**
   * 사용자의 연속 로그인 일수를 조회합니다.
   * @param userId 사용자 ID
   * @returns 연속 로그인 일수 또는 null
   */
  getLoginStreak(userId: string): Promise<number | null>;

  /**
   * 사용자의 친구 초대 수를 조회합니다.
   * @param userId 사용자 ID
   * @returns 친구 초대 수 또는 null
   */
  getFriendInvitationCount(userId: string): Promise<number | null>;

  /**
   * 사용자의 레벨을 조회합니다.
   * @param userId 사용자 ID
   * @returns 사용자 레벨 또는 null
   */
  getUserLevel(userId: string): Promise<number | null>;

  /**
   * 사용자의 아이템 수집 수량을 조회합니다.
   * @param userId 사용자 ID
   * @param itemId 아이템 ID
   * @returns 아이템 수집 수량 또는 null
   */
  getItemCollectionCount(userId: string, itemId: string): Promise<number | null>;
}
