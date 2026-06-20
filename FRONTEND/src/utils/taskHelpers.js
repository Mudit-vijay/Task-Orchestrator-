
import { arrayMove } from '@dnd-kit/sortable';

export const taskHelpers = {
    moveCardOrder: (cardOrder, activeId, overId) => {
        const oldIndex = cardOrder.indexOf(activeId);
        const newIndex = cardOrder.indexOf(overId);
        return arrayMove(cardOrder, oldIndex, newIndex);
    },

    moveItemsWithinContainer: (lists, containerId, activeId, overId) => {
        const items = lists[containerId];
        const activeIndex = items.findIndex(item => item._id === activeId);
        const overIndex = items.findIndex(item => item._id === overId);

        return {
            ...lists,
            [containerId]: arrayMove(items, activeIndex, overIndex)
        };
    },

    moveItemsBetweenContainers: (lists, activeContainer, overContainer, activeId, overId) => {
        const newActiveItems = lists[activeContainer].filter(item => item._id !== activeId);
        const movedItem = lists[activeContainer].find(item => item._id === activeId);

        const overItems = [...lists[overContainer]];
        const overIndex = overId ? overItems.findIndex(item => item._id === overId) : overItems.length;
        const insertAt = overIndex >= 0 ? overIndex : overItems.length;

        overItems.splice(insertAt, 0, movedItem);

        return {
            ...lists,
            [activeContainer]: newActiveItems,
            [overContainer]: overItems
        };
    },

    cleanupEmptyContainers: (lists, cardOrder) => {
        const cleanedLists = {};
        const updatedCardOrder = [];

        for (const cardId of cardOrder) {
            if (lists[cardId]?.length > 0) {
                cleanedLists[cardId] = lists[cardId];
                updatedCardOrder.push(cardId);
            }
        }

        return { cleanedLists, updatedCardOrder };
    }
};