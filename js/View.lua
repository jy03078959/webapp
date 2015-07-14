--
-- 
-- User: stone
-- email: 258137678@qq.com
-- Date: 14-6-29
-- Time: 上午10:55
--
module(..., package.seeall)

local function getPageContainer()
    return sceneTree.pageContainer
end

local function getDialogContainer()
    return sceneTree.dialogContent
end

local _pageViewMg
PageViewMg = nil

--[[===============================view=========================]]
local View = class("View")
--[[
-- 初始化视图的基本node容器以及事件绑定
-- ]]
function View:ctor(param)
    self.disposed = false
    self:setNode(display.newNode())
    layoutManager:addLayout(self:getNode())

    self:getNode()

    self:getNode():addClass("common.centerAndFull")
    self.viewName = "view"
    self.ema = EMA:getProxy()
    self.params = param or {}
end

function View:setManger(mg)
    self.manger = mg
end
--[[
-- flag 是否立即清除页面
-- ]]
function View:dispose()
    if self.disposed then
        return
    end
    self.disposed = true
    self:hide()
    self.ema:dispose()
    self:getNode().disposed=true
    g.setTimeout(function ()
        if isNodeExist(self:getNode()) then
            self:getNode():removeFromParent()
            if g.isLowRAM() then
                TextureCache:removeUnusedTextures()
                collectgarbage()
            end
        end
    end,0)

    g.log(self.viewName .. "====================================:dispose")
end

function View:hide()
    if isNodeExist(self:getNode()) then
        self:getNode():setVisible(false)
    end
end

function View:show()
    if isNodeExist(self:getNode()) then
        EMA:fire(EVENT.COMMON.VIEWCHANGE)
        self:getNode():setVisible(true)
    end
end


function View:setParams(data)
    self.params = data
end

function View:getParams()
    return self.params or {}
end

function View:getNode()
    return self.node
end

function View:setNode(node)
    self.node = node
end


function View:getViewName()
    return self.viewName
end

function View:setViewName(name)
    self.viewName = name
    self.node.__cname = name
    self.node:setSelector(name);
end






--[[===============================DialogView=========================]]
DialogView = class("DialogView", View)

function DialogView:init()
    if self.disposed then
        return
    end
    self:onInit(self:getParams())
end

function DialogView:onInit(data)
end

function DialogView:dispose(flag)
    DialogView.super.dispose(self,flag)
    self.manger:clearListData(self.index)
end

function DialogView:setIndex(index)
    self.index = index
end

--[[===============================PageView=========================]]

--[[
-- 项目中的page基类
--负责处理调用流程控制以及page生命周期控制
-- ]]
PageView = class("PageView", View)

function PageView:ctor(param)
    PageView.super.ctor(self, param)
    self.cachePage = false --设置该页面缓存不释放
    self.basePage = false --设置该页面是基础页面。page的最基本页面
    self:getNode():addClass("common.centerAndFull")
end

function PageView:init()
    if self.disposed then
        return
    end
    self:onInit(self:getParams())
end

--[[
-- 重新加载,每次页面加载都会调用
-- ]]
function PageView:reloadPage(data)
    g.log("PageView:reloadPage")
    _pageViewMg:setCurrentPage(self)
    self:setParams(data)
    if not self._executeOneEd then
        self:executeOne(data)
        self._executeOneEd = true
    end
end

function PageView:onInit(data)
end

function PageView:executeOne(data)
end


function PageView:isCachePage()
    if g.isLowRAM() then
        return false
    end
    return self.cachePage
end

function PageView:isBasePage()
    return self.basePage
end
function PageView:finish()
    view.PageViewMg:clearPage(self:getViewName())
end
function PageView:hideBefore()
    return true
end

--[[
-- 创建一个页面，
-- 缓存中不纯在该页面则读取文件后创建页面
-- ]]
local createPage = function(name, data, cb)
    local pageExt = require("app.view." .. name)
    local pageObject = pageExt.new(data);
    pageObject:setViewName(name)
    cb(pageObject)
end




--[[===============================ViewMg=========================]]
local viewMg = class("ViewMg")
function viewMg:ctor()
end


function viewMg:createPage(pagename, data, fn)
    createPage(pagename, data, function(page)
        local pageNode = page:getNode()
        local container = self:getContainer()
        if isFunction(page.getContainer) and page:getContainer() then
            container = page:getContainer()
        end
        container:addWidget(pageNode)
        pageNode.__name__ = pagename
        pageNode:setVisible(false)
        page:init(data)
        page:setManger(self)
        if type(fn) == "function" then
            fn(pagename, page, data)
        end
    end)
end

--[[
-- 回退当前页
-- ]]
function viewMg:back()
end


--[[===============================DialogviewMg=========================]]
_dialogViewMg = class("DialogviewMg", viewMg)
function _dialogViewMg:ctor()
    self.pageList = {}
    self.pageIndex = 1
end

function _dialogViewMg:setCurrentPage(page)
    self.currentPage = page
end

function _dialogViewMg:getCurrentPage()
    return self.currentPage
end

function _dialogViewMg:getCurrentPageName()
    if self.currentPage then
        return self.currentPage:getViewName()
    end
end

function _dialogViewMg:getDialogNum()
    return table.nums(self.pageList)
end

function _dialogViewMg:getContainer()
    return getDialogContainer()
end

function _dialogViewMg:showLastPage(data)
    local showPage = nil
    local lastPageId = self:findLastPageId()
    for k, v in pairs(self.pageList) do
        local currPageCache = v
        local page = currPageCache.page
        if k == lastPageId then
            currPageCache.data = data or currPageCache.data
            data = currPageCache.data
            page:show()
            page:setParams(data)
            if currPageCache.isReloadPage ~= true then
                page:reloadPage(data)
            end
            currPageCache.isReloadPage = true
            showPage = page
            self:setCurrentPage(page);
        else
            page:hide()
        end
    end
    return showPage
end

function _dialogViewMg:findLastPageId()
    local maxNum = 0
    for k, v in pairs(self.pageList) do
        maxNum = math.max(checkint(k), maxNum)
    end
    return maxNum .. ""
end

function _dialogViewMg:popLastPage()
    local maxNum = 0
    local lastPage = nil
    for k, v in pairs(self.pageList) do
        maxNum = math.max(checkint(k), maxNum)
    end
    lastPage = self.pageList[maxNum .. ""]
    self.pageList[maxNum .. ""] = nil
    return lastPage
end
--[[function _dialogViewMg:show(pageName, data)
    if self.showPageCd then
        g.clearTimeout(self.showPageCd)
    end
    self.showPageCd = g.setTimeout(function ()
        self:showImmediately(pageName,data)
    end,0)
end]]
function _dialogViewMg:show(name, data)
    g.log("showDialog----->", name, data)
    print("showDialog----->" .. name)
    self:create(name, data)
    return self:showLastPage()
end

function _dialogViewMg:create(name, data)
    self:createPage(name, data, function(pagename, page, data)
        local pageCache = {}
        pageCache.page = page
        pageCache.pagename = pagename
        pageCache.data = data
        self.pageIndex = self.pageIndex + 1
        self.pageList[self.pageIndex .. ""] = pageCache
        page:setIndex(self.pageIndex .. "")
    end)
    return self.pageList[self.pageIndex .. ""]
end

function _dialogViewMg:pageSize()
    return table.nums(self.pageList)
end

--[[
销毁所有页面
-- ]]
function _dialogViewMg:clearAll()
    for k, currPageCache in pairs(self.pageList) do
        g.log("消费弹出框")
        local page = currPageCache.page
        --销毁该页面
        page:dispose(true)
    end
    self.pageList = {}
end

--[[
销毁所有页面
-- ]]
function _dialogViewMg:clearListData(index)
    self.pageList[index] = nil
    self:showLastPage()
end

function _dialogViewMg:back(data)
    _dialogViewMg.super.back(self, data)
    local lastPageCache = self:popLastPage()
    if lastPageCache then
        local lastPage = lastPageCache.page
        --[[如果是基本页面提示不能退出，或者提示退出游戏]]
        lastPage:dispose()
        self:showLastPage()
        return true
    end
    self:showLastPage()
    return false
end

--[[===============================PageviewMg=========================]]
--[[
-- page管理器
-- ]]
_pageViewMg = class("PageviewMg", viewMg)
function _pageViewMg:ctor()
    self.pageList = {}
end

function _pageViewMg:setCurrentPage(page)
    self.currentPage = page
end

function _pageViewMg:getCurrentPage()
    return self.currentPage
end

function _pageViewMg:getCurrentPageName()
    if self.currentPage then
        return self.currentPage:getViewName()
    end
end

function _pageViewMg:getContainer()
    return getPageContainer()
end

function _pageViewMg:hasPage(name)
    for k, currPageCache in ipairs(self.pageList) do
        local page = currPageCache.page

        if name==currPageCache.pagename then
           return true
        end
    end
    return false
end

--[[
-- 显示最上层的一个page页面,隐藏其他页面
-- data 传入显示页面的数据参数
-- ]]
function _pageViewMg:showLastPage(data)
    self.oldPageName = self:getCurrentPageName()
    local length = #self.pageList
    local lock = false
    local showPageData = nill
    for k = length,1,-1 do
        local currPageCache = self.pageList[k]
        local page = currPageCache.page
        if not currPageCache.hide and not lock then
            currPageCache.data = data or currPageCache.data
            self._pushPageName = currPageCache.pagename
            showPageData = currPageCache
            lock=true
            currPageCache.hide = nil
        else
            page:hide()
        end
    end

    if isTable(showPageData) then
        local page = showPageData.page
        page:show()
        page:setParams(showPageData.data)
        page:reloadPage(showPageData.data)
    end
    
    if self.oldPageName ~= self:getCurrentPageName() then
        EMA:fire(EVENT.COMMON.PAGECHANGE, self:getCurrentPageName(),self.oldPageName)
    end
end
function _pageViewMg:getOldPageName()
    return self.oldPageName or ""
end
--[[
销毁所有页面
-- ]]
function _pageViewMg:clearAll()
    for k, currPageCache in ipairs(self.pageList) do
        local page = currPageCache.page
        --销毁该页面
        page:dispose(true)
    end
    self.pageList = {}
    self._pushPageName = ""
end

--[[
-- 强制清除页面。
-- ]]
function _pageViewMg:clearPage(name)
    for k, currPageCache in ipairs(self.pageList) do
        local page = currPageCache.page
        local pageName = currPageCache.pagename
        if name == pageName then
            --销毁该页面
            page:dispose()
            table.remove(self.pageList, k)
            break
        end
    end
    self:showLastPage()
end

--[[
-- 显示一个page
--  流程：
--      1：清除所有不用缓存的page，
--      2：判断需要显示的页面是否在缓存中，在则置顶，不在则创建页面内容添加到显示列表最上层，
--
-- ]]

function _pageViewMg:showPage(pageName, data)
    --[[if self.showPageCd then
        g.clearTimeout(self.showPageCd)
    end
    self.showPageCd = g.setTimeout(function ()
        self:showPageImmediately(pageName,data)
    end,0)]]
    self:showPageImmediately(pageName,data)
end

function _pageViewMg:showPageImmediately(pageName, data)
    g.log("showPage----->", pageName, data)
    if pageName == self._pushPageName then
        return
    end
    if not self:_isAbleChangePage() then
        return
    end
    self._pushPageName = pageName
    g.log("_pageViewMg:showPage->" .. pageName)

    if not pcall(function() require("app.view." .. pageName) end) then
        g.log(pageName, "--------------文件不存在")
        if string.find(pageName, 'f_build_') == nil then
            pageName = "f_demo"
        else
            pageName = "f_build_demo"
        end
    end

    local isOld = false --是否是老页面

    for k = #self.pageList, 1, -1 do
        local currPageCache = self.pageList[k]
        local currPage = currPageCache.page
        if currPage then
            if currPage:getViewName() == pageName then
                isOld = true
            end
            if currPage:isCachePage() and not currPage:isBasePage() then
                currPageCache.hide=true
            end
            --如果缓存页面，以及同名页面隐藏该页面不用销毁
            if currPage:isCachePage() or currPage:isBasePage() or currPage:getViewName() == pageName then
                currPage:hide()
            else
                --销毁该页面
                currPage:dispose()
                table.remove(self.pageList, k)
            end
        end
    end

    --如果是老页面。把该页面置顶
    if isOld then
        for k, currPageCache in ipairs(self.pageList) do
            local currPage = currPageCache.page
            if currPage:getViewName() == pageName then
                currPageCache.hide=nil
                table.remove(self.pageList, k)
                self.pageList[#self.pageList + 1] = currPageCache
                break
            end
        end
    else
        --如果不是老页面 创建新页面 加入pagelist
        _pageViewMg:createPage(pageName, data, function(pagename, page, data)
            local pageCache = {}
            pageCache.page = page
            pageCache.pagename = pagename
            pageCache.data = data
            self.pageList[#self.pageList + 1] = pageCache
        end)
    end


    self:showLastPage(data)
end

--[[
-- 追加覆盖一个页面
--  流程：
--      1： 判断需要显示的页面是否在缓存中 ，存在则移除该页面上层需要移除的页面
--      2： 显示当前页面信息
-- ]]

function _pageViewMg:pushPage(pageName, data)
    --[[if self.showPageCd then
        g.clearTimeout(self.showPageCd)
    end
    self.showPageCd = g.setTimeout(function ()
        self:pushPageImmediately(pageName,data)
    end,0)]]
    self:pushPageImmediately(pageName,data)
end
function _pageViewMg:pushPageImmediately(pageName, data)
    g.log("pushPage---->", pageName, data)
    if pageName == self._pushPageName then
        return
    end
    if not self:_isAbleChangePage() then
        return
    end
    self._pushPageName = pageName

    g.log("_pageViewMg:pushPage->" .. pageName)

    local isOld = false --是否是老页面
    for k, currPageCache in ipairs(self.pageList) do
        local currPage = currPageCache.page
        if currPage:getViewName() == pageName then
            isOld = true
            break
        end
    end
    if isOld then
        for k = #self.pageList, 1, -1 do
            local currPageCache = self.pageList[k]
            local currPage = currPageCache.page
            if currPage then
                --如果找到要显示的页面在缓存中，把该页面置顶然后，结束查找，
                if currPage:getViewName() == pageName then

                    table.remove(self.pageList, k)
                    if currPage:isCachePage() and not currPage:isBasePage() then
                        currPageCache.hide=nil
                        self.pageList[#self.pageList + 1] = currPageCache
                    else
                        currPage:dispose()
                        _pageViewMg:createPage(pageName, data, function(pagename, page, data)
                            local pageCache = {}
                            pageCache.page = page
                            pageCache.pagename = pagename
                            pageCache.data = data
                            self.pageList[#self.pageList + 1] = pageCache
                        end)
                    end

                    break
                end
               --[[ if currPage:isCachePage() and not currPage:isBasePage() then
                    currPageCache.hide=true
                end
                --如果缓存页面，隐藏该页面
                if currPage:isCachePage() or currPage:isBasePage() then
                    currPage:hide()
                else
                    --销毁该页面
                    currPage:dispose()
                    table.remove(self.pageList, k)
                end]]
            end
        end

    else
        --如果不是老页面 创建新页面 加入pagelist
        _pageViewMg:createPage(pageName, data, function(pagename, page, data)
            local pageCache = {}
            pageCache.page = page
            pageCache.pagename = pagename
            pageCache.data = data
            self.pageList[#self.pageList + 1] = pageCache
        end)
    end

    self:showLastPage(data)
end

function _pageViewMg:getLastPageCacheData()
    local length = #self.pageList
    local lockIndex = length
    for k = length,1,-1 do
        local currPageCache = self.pageList[k]
        if currPageCache.pagename==self:getCurrentPageName()  then
            lockIndex=k
        end
    end
    return self.pageList[lockIndex],lockIndex
end

--[[
-- 回退一个页面
-- data: 回退到下一个页面传入的参数
-- ]]
function _pageViewMg:backPage(data)
    if not self:_isAbleChangePage() then
        return
    end
    _pageViewMg.super.back(self, data)
    local lastPageCache ,index= self:getLastPageCacheData()
    local lastPage = lastPageCache.page
    if not lastPage:hideBefore() then
        return
    end

    --[[如果是基本页面提示不能退出，或者提示退出游戏]]
    if lastPage:isBasePage() then
        g.log("基本页面不能退出")
    else
        if lastPage:isCachePage() then
            --缓存页面直接隐藏该页面并放到底部
            lastPage:hide()
            lastPageCache.hide=true
            --[[lastPage = table.remove(self.pageList, #self.pageList)
            table.insert(self.pageList, 1, lastPage)]]
        else
            lastPage:dispose()
            table.remove(self.pageList, index)
        end
    end


    self:showLastPage(data)

end

function _pageViewMg:_isAbleChangePage()
    local lastPageCache = self.pageList[#self.pageList]
    if lastPageCache then
        local lastPage = lastPageCache.page
        if lastPage:hideBefore() then
            return true
        else
            return false
        end
    else
        return true
    end
end

PageViewMg = _pageViewMg.new()
DialogViewMg = _dialogViewMg.new()
