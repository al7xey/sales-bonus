/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
    const { discount, sale_price, quantity } = purchase;
    const discountMultiplier = 1 - (discount / 100);
    // @TODO: Расчет выручки от операции
    const revenue = sale_price * quantity * discountMultiplier;
    return +revenue.toFixed(2); 

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    const { profit } = seller;
    // @TODO: Расчет бонуса от позиции в рейтинге
    let bonus = 0;
    if (index === 0) {
        // 15% — для продавца, который принёс наибольшую прибыль (первое место)
        bonus = 0.15;
    } else if (index === 1 || index === 2) {
        // 10% — для продавцов на втором и третьем месте
        bonus = 0.10;
    } else if (index === total - 1) {
        // 0% — для продавца на последнем месте
        bonus = 0;
    } else {
        // 5% — для всех остальных продавцов
        bonus = 0.05;
    }
    // Возвращаем бонус в рублях 
    return profit * bonus;
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
    if (!data || !Array.isArray(data.sellers) || data.sellers.length === 0 || !Array.isArray(data.products) || data.products.length === 0 || !Array.isArray(data.purchase_records) || data.purchase_records.length === 0) {
        throw new Error('Некорректные входные данные');
    }
    // @TODO: Проверка наличия опций
    const { calculateRevenue, calculateBonus } = options;
    if (typeof calculateRevenue !== 'function' || typeof calculateBonus !== 'function') {
        throw new Error('Чего-то не хватает');
    }
    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }));
    // @TODO: Индексация продавцов и товаров для быстрого доступ
    const sellerIndex = Object.fromEntries(sellerStats.map(seller => [seller.id, seller]));
    const productIndex = Object.fromEntries(data.products.map(product => [product.sku, product]));
    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => { // Чек 
        const seller = sellerIndex[record.seller_id]; // Продавец
        seller.sales_count += 1; // Увеличить количество продаж 
        // Расчёт прибыли для каждого товара
        record.items.forEach(item => {
            const product = productIndex[item.sku]; // Товар
            const cost = product.purchase_price*item.quantity;// Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
            const revenue = calculateRevenue(item, product);// Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
            const profit = revenue - cost;// Посчитать прибыль: выручка минус себестоимость
            // Увеличить общую накопленную прибыль (profit) у продавца  
            // ДОБАВИТЬ: накапливаем выручку от каждого товара
            seller.revenue += revenue;
            seller.profit += profit; 
            // Учёт количества проданных товаров
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            // По артикулу товара увеличить его проданное количество у продавца
            seller.products_sold[item.sku] += item.quantity;
        });
    });

    // @TODO: Сортировка продавцов по прибыли
    // Сортируем продавцов по прибыли
    sellerStats.sort((a, b) => b.profit - a.profit); 
    // @TODO: Назначение премий на основе ранжирования
    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonusByProfit(index, sellerStats.length, seller);// Считаем бонус
        seller.top_products = Object.entries(seller.products_sold).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([sku, quantity]) => ({sku, quantity}));// Формируем топ-10 товаров
    });
    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sellerStats.map(seller => ({
        seller_id: seller.id,// Строка, идентификатор продавца
        name: seller.name,// Строка, имя продавца
        revenue: +seller.revenue.toFixed(2),// Число с двумя знаками после точки, выручка продавца
        profit: +seller.profit.toFixed(2),// Число с двумя знаками после точки, прибыль продавца
        sales_count: seller.sales_count,// Целое число, количество продаж продавца
        top_products: seller.top_products,// Массив объектов вида: { "sku": "SKU_008","quantity": 10}, топ-10 товаров продавца
        bonus: +seller.bonus.toFixed(2)// Число с двумя знаками после точки, бонус продавца
    }));
}
